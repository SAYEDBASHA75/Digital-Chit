import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createClient } from "@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", cors());
app.use("*", logger(console.log));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// ── Document storage bucket ───────────────────────────────────────────────────
const DOCS_BUCKET = "make-ca64c5bf-docs";
(async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.name === DOCS_BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(DOCS_BUCKET, { public: false });
    }
  } catch (e) {
    console.log("Bucket init error:", e);
  }
})();

// Auth routes
app.post("/make-server-ca64c5bf/auth/signup", async (c) => {
  try {
    const { email, phone, password, name, role } = await c.req.json();

    if (!email || !phone || !password || !name) {
      return c.json({ error: "All fields are required" }, 400);
    }

    const safeRole = role === "admin" ? "admin" : "member";

    // Check for existing email / phone
    const existingEmail = await kv.get(`auth:email:${email.toLowerCase()}`);
    if (existingEmail) {
      return c.json({ error: "An account with this email already exists" }, 400);
    }
    const existingPhone = await kv.get(`auth:phone:${phone}`);
    if (existingPhone) {
      return c.json({ error: "An account with this phone number already exists" }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, phone, role: safeRole },
      email_confirm: true,
    });

    if (error) {
      console.log("Signup error:", error);
      return c.json({ error: error.message }, 400);
    }

    if (!data.user) {
      return c.json({ error: "User creation failed: no user returned" }, 500);
    }

    const uid = data.user.id;

    // Persist credential mappings and role in KV
    await kv.set(`auth:email:${email.toLowerCase()}`, uid);
    await kv.set(`auth:phone:${phone}`, uid);
    await kv.set(`user:${uid}:credentials`, {
      email: email.toLowerCase(),
      phone,
      name,
      createdAt: new Date().toISOString(),
    });
    await kv.set(`user:${uid}:role`, safeRole);

    console.log(`[SIGNUP SUCCESS] User ${uid} (${name}) created with role: ${safeRole}`);

    return c.json({ user: data.user, role: safeRole });
  } catch (error) {
    console.log("Signup exception:", error);
    return c.json({ error: `Failed to create user: ${error}` }, 500);
  }
});

app.post("/make-server-ca64c5bf/auth/signin", async (c) => {
  try {
    const { identifier, password, loginType } = await c.req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    let email = identifier;
    let userId: string | null = null;
    const ipAddress = c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip") || "unknown";
    const userAgent = c.req.header("user-agent") || "unknown";

    if (loginType === "phone") {
      userId = await kv.get(`auth:phone:${identifier}`);
      if (!userId) {
        // Store failed login attempt (phone not found)
        const failedEventId = crypto.randomUUID();
        await kv.set(`loginEvent:failed:${failedEventId}`, {
          id: failedEventId,
          identifier,
          loginType: "phone",
          success: false,
          reason: "Invalid phone number",
          timestamp: new Date().toISOString(),
          ipAddress,
          userAgent,
        });
        return c.json({ error: "Invalid phone number or password" }, 401);
      }
      const credentials = await kv.get(`user:${userId}:credentials`);
      if (!credentials) {
        // Store failed login attempt (account not found)
        const failedEventId = crypto.randomUUID();
        await kv.set(`loginEvent:failed:${failedEventId}`, {
          id: failedEventId,
          identifier,
          loginType: "phone",
          success: false,
          reason: "Account not found",
          timestamp: new Date().toISOString(),
          ipAddress,
          userAgent,
        });
        return c.json({ error: "Invalid phone number or password" }, 401);
      }
      email = credentials.email;
    } else {
      userId = await kv.get(`auth:email:${identifier.toLowerCase()}`);
      if (!userId) {
        // Store failed login attempt (email not found)
        const failedEventId = crypto.randomUUID();
        await kv.set(`loginEvent:failed:${failedEventId}`, {
          id: failedEventId,
          identifier,
          loginType: "email",
          success: false,
          reason: "Invalid email",
          timestamp: new Date().toISOString(),
          ipAddress,
          userAgent,
        });
        return c.json({ error: "Invalid email or password" }, 401);
      }
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      console.log("Signin error:", error);
      // Store failed login attempt (wrong password)
      const failedEventId = crypto.randomUUID();
      const credentials = await kv.get(`user:${userId}:credentials`);
      await kv.set(`user:${userId}:loginEvent:${failedEventId}`, {
        id: failedEventId,
        userId,
        identifier,
        name: credentials?.name || "Unknown",
        loginType: loginType || "email",
        success: false,
        reason: "Invalid password",
        timestamp: new Date().toISOString(),
        ipAddress,
        userAgent,
      });
      await kv.set(`loginEvent:failed:${failedEventId}`, {
        id: failedEventId,
        identifier,
        loginType: loginType || "email",
        success: false,
        reason: "Invalid password",
        timestamp: new Date().toISOString(),
        ipAddress,
        userAgent,
      });
      return c.json({ error: "Invalid credentials. Please check your email/phone and password." }, 401);
    }

    // Fetch the role stored in KV — this is authoritative, not client-supplied
    const role = (await kv.get(`user:${userId}:role`)) || "member";
    const credentials = await kv.get(`user:${userId}:credentials`);

    console.log(`[LOGIN SUCCESS] User ${userId} logged in with role: ${role}`);

    // Get previous login events to find last login time
    const loginEventKeys = await kv.getByPrefix(`user:${userId}:loginEvent:`);
    const previousLogins = loginEventKeys
      .filter((ev: any) => ev.success) // Only successful logins
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastLogin = previousLogins.length > 0 ? previousLogins[0].timestamp : null;

    // Store successful login event for audit trail
    const loginEventId = crypto.randomUUID();
    await kv.set(`user:${userId}:loginEvent:${loginEventId}`, {
      id: loginEventId,
      userId,
      identifier,
      name: credentials?.name || "Unknown",
      loginType: loginType || "email",
      role,
      success: true,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
    });

    return c.json({ session: data.session, user: data.user, role, lastLogin });
  } catch (error) {
    console.log("Signin exception:", error);
    return c.json({ error: `Failed to sign in: ${error}` }, 500);
  }
});

app.post("/make-server-ca64c5bf/auth/forgot-password", async (c) => {
  try {
    const { identifier } = await c.req.json();

    let userId;

    // Check if it's email or phone
    if (identifier.includes("@")) {
      userId = await kv.get(`auth:email:${identifier.toLowerCase()}`);
    } else {
      userId = await kv.get(`auth:phone:${identifier}`);
    }

    if (!userId) {
      return c.json({ error: "Account not found" }, 404);
    }

    const credentials = await kv.get(`user:${userId}:credentials`);
    if (!credentials) {
      return c.json({ error: "Account not found" }, 404);
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store reset code with expiry (10 minutes) in KV store
    await kv.set(`reset:${userId}`, {
      code: resetCode,
      expiry: Date.now() + 10 * 60 * 1000,
      identifier: identifier,
    });

    // Log only server-side — never return the code to the client
    console.log(`[RESET CODE] ${identifier} → ${resetCode}`);

    return c.json({ success: true, message: "Reset code generated. Check server logs or your registered contact." });
  } catch (error) {
    console.log("Forgot password error:", error);
    return c.json({ error: `Failed to process request: ${error}` }, 500);
  }
});

app.post("/make-server-ca64c5bf/auth/reset-password", async (c) => {
  try {
    const { identifier, resetCode, newPassword } = await c.req.json();

    let userId;

    // Find user by identifier
    if (identifier.includes("@")) {
      userId = await kv.get(`auth:email:${identifier.toLowerCase()}`);
    } else {
      userId = await kv.get(`auth:phone:${identifier}`);
    }

    if (!userId) {
      return c.json({ error: "Account not found" }, 404);
    }

    // Verify reset code from KV store
    const resetData = await kv.get(`reset:${userId}`);
    if (!resetData) {
      return c.json({ error: "No reset request found. Please request a new code." }, 400);
    }

    if (resetData.code !== resetCode) {
      return c.json({ error: "Invalid reset code" }, 400);
    }

    if (Date.now() > resetData.expiry) {
      await kv.del(`reset:${userId}`);
      return c.json({ error: "Reset code has expired. Please request a new one." }, 400);
    }

    const credentials = await kv.get(`user:${userId}:credentials`);
    if (!credentials) {
      return c.json({ error: "Account not found" }, 404);
    }

    // Update password using Supabase Admin
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.log("Password reset error:", error);
      return c.json({ error: "Failed to reset password" }, 500);
    }

    // Clear reset code from KV store
    await kv.del(`reset:${userId}`);

    return c.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.log("Reset password exception:", error);
    return c.json({ error: `Failed to reset password: ${error}` }, 500);
  }
});

// Get current user's profile + role (called on app load to sync role)
app.get("/make-server-ca64c5bf/auth/profile", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user?.id) return c.json({ error: "Unauthorized" }, 401);

    const role = (await kv.get(`user:${user.id}:role`)) || "member";
    const credentials = await kv.get(`user:${user.id}:credentials`);

    return c.json({ user, role, name: credentials?.name || user.user_metadata?.name || "" });
  } catch (e) {
    return c.json({ error: `Profile fetch failed: ${e}` }, 500);
  }
});

// Middleware to verify auth
async function verifyAuth(c: any, next: any) {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];

  if (!accessToken) {
    return c.json({ error: "Unauthorized: No token provided" }, 401);
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (!user || error) {
    console.log("Auth verification error:", error);
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }

  const userRole = await kv.get(`user:${user.id}:role`) || "member";

  c.set("userId", user.id);
  c.set("user", user);
  c.set("userRole", userRole);
  await next();
}

// Middleware to verify admin role
async function verifyAdmin(c: any, next: any) {
  const userId = c.get("userId");
  
  if (!userId) {
    return c.json({ error: "Unauthorized: User not authenticated" }, 401);
  }

  const userRole = await kv.get(`user:${userId}:role`);
  
  if (userRole !== "admin") {
    console.log(`Admin access denied for user ${userId} with role: ${userRole}`);
    return c.json({ error: "Forbidden: Admin access required" }, 403);
  }

  await next();
}

// Chit group routes
app.get("/make-server-ca64c5bf/groups", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    // Get all group IDs for this user from KV store
    const groupIdEntries = await kv.getByPrefix(`user:${userId}:group:`);
    const groups: any[] = [];
    for (const groupId of groupIdEntries) {
      const group = await kv.get(`group:${groupId}`);
      if (group) groups.push(group);
    }
    return c.json({ groups });
  } catch (error) {
    console.log("Get groups error:", error);
    return c.json({ error: `Failed to fetch groups: ${error}` }, 500);
  }
});

app.post("/make-server-ca64c5bf/groups", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");

    // Only admin users may create groups
    const userRole = await kv.get(`user:${userId}:role`);
    if (userRole !== "admin") {
      return c.json({ error: "Forbidden: only admins can create chit groups" }, 403);
    }

    const groupData = await c.req.json();

    // Validate required numeric fields
    const totalMembers = parseInt(groupData.totalMembers);
    const monthlyContribution = parseInt(groupData.monthlyContribution);
    const duration = parseInt(groupData.duration);

    if (!groupData.name || !groupData.name.trim()) {
      return c.json({ error: "Group name is required" }, 400);
    }
    if (isNaN(totalMembers) || totalMembers < 2) {
      return c.json({ error: "Total members must be at least 2" }, 400);
    }
    if (isNaN(monthlyContribution) || monthlyContribution < 1) {
      return c.json({ error: "Monthly contribution must be a positive number" }, 400);
    }
    if (isNaN(duration) || duration < 1) {
      return c.json({ error: "Duration must be at least 1 month" }, 400);
    }

    const totalAmount = totalMembers * monthlyContribution;
    const groupId = crypto.randomUUID();
    const group = {
      id: groupId,
      name: groupData.name.trim(),
      totalMembers,
      monthlyContribution,
      duration,
      totalAmount,
      startDate: groupData.startDate || new Date().toISOString().split("T")[0],
      nextBidDate: groupData.nextBidDate || groupData.startDate || new Date().toISOString().split("T")[0],
      organizerUpiId: groupData.organizerUpiId || "",
      organizerName: groupData.organizerName || "",
      createdBy: userId,
      createdAt: new Date().toISOString(),
      currentMonth: 1,
      status: "active",   // ← start as active so Pay Now is visible immediately
      members: [userId],
    };

    await kv.set(`group:${groupId}`, group);
    await kv.set(`user:${userId}:group:${groupId}`, groupId);

    // Auto-add creator as admin member
    const creatorCreds = await kv.get(`user:${userId}:credentials`);
    const creatorMember = {
      id: userId,
      userId,
      groupId,
      name: creatorCreds?.name || groupData.organizerName || "Creator",
      email: creatorCreds?.email || "",
      phone: creatorCreds?.phone || "",
      role: "admin",
      joinedDate: new Date().toISOString(),
      addedBy: userId,
      contributionsPaid: 0,
      hasWonBid: false,
    };
    await kv.set(`group:${groupId}:member:${userId}`, creatorMember);

    return c.json({ group });
  } catch (error) {
    console.log("Create group error:", error);
    return c.json({ error: `Failed to create group: ${error}` }, 500);
  }
});

// POST /groups/join — creates a pending join request (requires admin approval)
app.post("/make-server-ca64c5bf/groups/join", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { inviteCode } = await c.req.json();
    if (!inviteCode?.trim()) return c.json({ error: "Invite code is required" }, 400);

    const raw = inviteCode.trim().toLowerCase().replace(/-/g, "");
    const allGroupData = await kv.getByPrefix("group:");
    const groups = allGroupData.filter(
      (g: any) => g && typeof g === "object" && g.id && g.name && !g.userId && !g.groupId && !g.requestedAt
    );
    const group = groups.find((g: any) => g.id.replace(/-/g, "").toLowerCase().startsWith(raw));
    if (!group) return c.json({ error: "No group found with that invite code" }, 404);

    const alreadyMember = await kv.get(`group:${group.id}:member:${userId}`);
    if (alreadyMember) return c.json({ error: "You are already a member of this group" }, 400);

    const existing: any = await kv.get(`group:${group.id}:joinRequest:${userId}`);
    if (existing && existing.status === "pending") return c.json({ request: existing, alreadyPending: true });

    const creds: any = await kv.get(`user:${userId}:credentials`) || {};
    const now = new Date().toISOString();
    const request = {
      userId, groupId: group.id, groupName: group.name,
      userName: creds.name || "", email: creds.email || "", phone: creds.phone || "",
      status: "pending", requestedAt: now, updatedAt: now,
    };
    await kv.set(`group:${group.id}:joinRequest:${userId}`, request);
    await kv.set(`user:${userId}:joinRequest:${group.id}`, group.id);
    console.log(`User ${userId} requested to join group ${group.id}`);
    return c.json({ request, group });
  } catch (e) {
    console.log("Join request error:", e);
    return c.json({ error: `Request failed: ${e}` }, 500);
  }
});

// GET /groups/join-requests — admin: all requests for admin's groups
app.get("/make-server-ca64c5bf/groups/join-requests", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const userRole = await kv.get(`user:${userId}:role`);
    if (userRole !== "admin") return c.json({ error: "Admin only" }, 403);
    const allData = await kv.getByPrefix("group:");
    const myGroups = allData.filter(
      (g: any) => g && typeof g === "object" && g.id && g.name && g.createdBy === userId && !g.userId && !g.groupId && !g.requestedAt
    );
    const requests: any[] = [];
    for (const grp of myGroups) {
      const reqs = allData.filter(
        (r: any) => r && typeof r === "object" && r.groupId === grp.id && r.userId && r.requestedAt
      );
      reqs.forEach((r: any) => requests.push({ ...r, groupName: grp.name }));
    }
    requests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    return c.json({ requests });
  } catch (e) {
    return c.json({ error: `${e}` }, 500);
  }
});

// GET /groups/browse — list all non-completed groups for the join-group discovery page
app.get("/make-server-ca64c5bf/groups/browse", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const allGroupData = await kv.getByPrefix("group:");
    const groups = allGroupData.filter(
      (g: any) => g && typeof g === "object" && g.id && g.name && !g.userId && !g.groupId
    );

    const result = await Promise.all(
      groups.map(async (g: any) => {
        const members = await kv.getByPrefix(`group:${g.id}:member:`);
        const currentMembers = members.length;
        const alreadyMember = await kv.get(`group:${g.id}:member:${userId}`);
        const reqStatus = await kv.get(`group:${g.id}:joinRequest:${userId}`);
        return {
          id: g.id,
          name: g.name,
          inviteCode: g.id.slice(0, 8).toUpperCase(),
          totalSlots: g.totalMembers,
          currentMembers,
          monthlyContribution: g.monthlyContribution,
          duration: g.duration,
          currentMonth: g.currentMonth || 0,
          status: g.status,
          organizerName: g.organizerName || "",
          hasVacancy: currentMembers < g.totalMembers,
          alreadyMember: !!alreadyMember,
          requestStatus: reqStatus?.status || null,
        };
      })
    );

    // Sort: vacancy first, then by name
    result.sort((a, b) => {
      if (a.hasVacancy && !b.hasVacancy) return -1;
      if (!a.hasVacancy && b.hasVacancy) return 1;
      return a.name.localeCompare(b.name);
    });

    return c.json({ groups: result });
  } catch (e) {
    console.log("Browse groups error:", e);
    return c.json({ error: `${e}` }, 500);
  }
});

// Static group sub-routes MUST be before :groupId param route
// Preview a group by invite code (first 8 chars of group UUID, case-insensitive)
app.get("/make-server-ca64c5bf/groups/preview/:inviteCode", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const raw = c.req.param("inviteCode").trim().toLowerCase().replace(/-/g, "");
    if (raw.length < 4) return c.json({ error: "Invite code too short" }, 400);

    const allGroupData = await kv.getByPrefix("group:");
    const groups = allGroupData.filter(
      (g: any) => g && typeof g === "object" && g.id && g.name && !g.userId && !g.groupId
    );
    const match = groups.find((g: any) => g.id.replace(/-/g, "").toLowerCase().startsWith(raw));

    if (!match) return c.json({ error: "No group found with that invite code" }, 404);

    const alreadyMember = await kv.get(`group:${match.id}:member:${userId}`);
    if (alreadyMember) return c.json({ error: "You are already a member of this group" }, 400);

    return c.json({
      group: {
        id: match.id,
        name: match.name,
        totalMembers: match.totalMembers,
        monthlyContribution: match.monthlyContribution,
        duration: match.duration,
        currentMonth: match.currentMonth,
        status: match.status,
        startDate: match.startDate,
        organizerName: match.organizerName,
        inviteCode: match.id.slice(0, 8).toUpperCase(),
      },
    });
  } catch (e) {
    console.log("Preview group error:", e);
    return c.json({ error: `Preview failed: ${e}` }, 500);
  }
});

app.get("/make-server-ca64c5bf/groups/:groupId", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const group = await kv.get(`group:${groupId}`);

    if (!group) {
      return c.json({ error: "Group not found" }, 404);
    }

    return c.json({ group });
  } catch (error) {
    console.log("Get group error:", error);
    return c.json({ error: `Failed to fetch group: ${error}` }, 500);
  }
});

// ── User Search ──
app.get("/make-server-ca64c5bf/users/search", verifyAuth, async (c) => {
  try {
    const q = (c.req.query("q") || "").trim().toLowerCase();
    if (!q) return c.json({ users: [] });

    let userId: string | null = null;

    if (q.includes("@")) {
      userId = await kv.get(`auth:email:${q}`);
    } else {
      userId = await kv.get(`auth:phone:${q}`);
    }

    if (!userId) return c.json({ users: [] });

    const creds = await kv.get(`user:${userId}:credentials`);
    if (!creds) return c.json({ users: [] });

    return c.json({ users: [{ userId, name: creds.name, email: creds.email, phone: creds.phone }] });
  } catch (error) {
    console.log("User search error:", error);
    return c.json({ error: `Search failed: ${error}` }, 500);
  }
});

// Member routes
app.get("/make-server-ca64c5bf/groups/:groupId/members", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const members = await kv.getByPrefix(`group:${groupId}:member:`);
    return c.json({ members });
  } catch (error) {
    console.log("Get members error:", error);
    return c.json({ error: `Failed to fetch members: ${error}` }, 500);
  }
});

app.post("/make-server-ca64c5bf/groups/:groupId/members", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const requesterId = c.get("userId");
    const { targetUserId, name, email, phone, role } = await c.req.json();

    // Verify requester is admin of this group
    const requesterMember = await kv.get(`group:${groupId}:member:${requesterId}`);
    if (!requesterMember || requesterMember.role !== "admin") {
      return c.json({ error: "Only group admins can add members" }, 403);
    }

    // Check if already a member
    const existing = await kv.get(`group:${groupId}:member:${targetUserId}`);
    if (existing) {
      return c.json({ error: "User is already a member of this group" }, 400);
    }

    const member = {
      id: targetUserId,
      userId: targetUserId,
      groupId,
      name: name || "",
      email: email || "",
      phone: phone || "",
      role: role === "admin" ? "admin" : "member",
      joinedDate: new Date().toISOString(),
      addedBy: requesterId,
      contributionsPaid: 0,
      hasWonBid: false,
    };

    await kv.set(`group:${groupId}:member:${targetUserId}`, member);
    // Add group to the new member's group list so they see it on their dashboard
    await kv.set(`user:${targetUserId}:group:${groupId}`, groupId);

    return c.json({ member });
  } catch (error) {
    console.log("Add member error:", error);
    return c.json({ error: `Failed to add member: ${error}` }, 500);
  }
});

// Update member role
app.put("/make-server-ca64c5bf/groups/:groupId/members/:memberId/role", verifyAuth, async (c) => {
  try {
    const { groupId, memberId } = c.req.param();
    const requesterId = c.get("userId");
    const { role } = await c.req.json();

    const requesterMember = await kv.get(`group:${groupId}:member:${requesterId}`);
    if (!requesterMember || requesterMember.role !== "admin") {
      return c.json({ error: "Only admins can change roles" }, 403);
    }

    const member = await kv.get(`group:${groupId}:member:${memberId}`);
    if (!member) return c.json({ error: "Member not found" }, 404);

    member.role = role === "admin" ? "admin" : "member";
    await kv.set(`group:${groupId}:member:${memberId}`, member);

    return c.json({ member });
  } catch (error) {
    console.log("Update role error:", error);
    return c.json({ error: `Failed to update role: ${error}` }, 500);
  }
});

// Remove member
app.delete("/make-server-ca64c5bf/groups/:groupId/members/:memberId", verifyAuth, async (c) => {
  try {
    const { groupId, memberId } = c.req.param();
    const requesterId = c.get("userId");

    const requesterMember = await kv.get(`group:${groupId}:member:${requesterId}`);
    if (!requesterMember || requesterMember.role !== "admin") {
      return c.json({ error: "Only admins can remove members" }, 403);
    }

    await kv.del(`group:${groupId}:member:${memberId}`);
    await kv.del(`user:${memberId}:group:${groupId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log("Remove member error:", error);
    return c.json({ error: `Failed to remove member: ${error}` }, 500);
  }
});

// Contribution routes
app.get("/make-server-ca64c5bf/groups/:groupId/contributions", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const contributions = await kv.getByPrefix(`group:${groupId}:contribution:`);
    return c.json({ contributions });
  } catch (error) {
    console.log("Get contributions error:", error);
    return c.json({ error: `Failed to fetch contributions: ${error}` }, 500);
  }
});

app.post("/make-server-ca64c5bf/groups/:groupId/contributions", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const userId = c.get("userId");
    const contributionData = await c.req.json();

    const contributionId = crypto.randomUUID();
    const contribution = {
      id: contributionId,
      ...contributionData,
      groupId,
      userId,
      paidDate: new Date().toISOString(),
      status: "paid",
    };

    await kv.set(`group:${groupId}:contribution:${contributionId}`, contribution);

    const member = await kv.get(`group:${groupId}:member:${userId}`);
    if (member) {
      member.contributionsPaid = (member.contributionsPaid || 0) + 1;
      await kv.set(`group:${groupId}:member:${userId}`, member);
    }

    return c.json({ contribution });
  } catch (error) {
    console.log("Record contribution error:", error);
    return c.json({ error: `Failed to record contribution: ${error}` }, 500);
  }
});

// Bid routes
app.get("/make-server-ca64c5bf/groups/:groupId/bids", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const bids = await kv.getByPrefix(`group:${groupId}:bid:`);
    return c.json({ bids });
  } catch (error) {
    console.log("Get bids error:", error);
    return c.json({ error: `Failed to fetch bids: ${error}` }, 500);
  }
});

app.post("/make-server-ca64c5bf/groups/:groupId/bids", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const userId = c.get("userId");
    const { bidAmount, month } = await c.req.json();

    const group = await kv.get(`group:${groupId}`);
    if (!group) {
      return c.json({ error: "Group not found" }, 404);
    }

    if (bidAmount > group.totalAmount) {
      return c.json({ error: "Bid amount exceeds total pool" }, 400);
    }

    const bidId = crypto.randomUUID();
    const bid = {
      id: bidId,
      groupId,
      userId,
      bidAmount,
      month: month || group.currentMonth,
      bidDate: new Date().toISOString(),
      status: "pending",
    };

    await kv.set(`group:${groupId}:bid:${bidId}`, bid);
    return c.json({ bid });
  } catch (error) {
    console.log("Place bid error:", error);
    return c.json({ error: `Failed to place bid: ${error}` }, 500);
  }
});

app.post("/make-server-ca64c5bf/groups/:groupId/bids/resolve", verifyAuth, async (c) => {
  try {
    const adminId = c.get("userId");
    const groupId = c.req.param("groupId");
    const group: any = await kv.get(`group:${groupId}`);
    if (!group) return c.json({ error: "Group not found" }, 404);

    const adminRole = await kv.get(`user:${adminId}:role`);
    if (adminRole !== "admin") return c.json({ error: "Admin only" }, 403);

    const bids = await kv.getByPrefix(`group:${groupId}:bid:`);
    const pendingBids = bids.filter(
      (b: any) => b.status === "pending" && b.month === group.currentMonth
    );
    if (pendingBids.length === 0) return c.json({ error: "No pending bids for current month" }, 400);

    const lowestBid: any = pendingBids.reduce((min: any, bid: any) =>
      bid.bidAmount < min.bidAmount ? bid : min
    );

    // Fetch winner's name
    const winnerMember: any = await kv.get(`group:${groupId}:member:${lowestBid.userId}`);
    const winnerName = winnerMember?.name || "Unknown Member";

    lowestBid.status = "won";
    lowestBid.winnerName = winnerName;
    await kv.set(`group:${groupId}:bid:${lowestBid.id}`, lowestBid);

    if (winnerMember) {
      winnerMember.hasWonBid = true;
      winnerMember.wonMonth = group.currentMonth;
      await kv.set(`group:${groupId}:member:${lowestBid.userId}`, winnerMember);
    }

    for (const bid of pendingBids) {
      if (bid.id !== lowestBid.id) {
        bid.status = "lost";
        await kv.set(`group:${groupId}:bid:${bid.id}`, bid);
      }
    }

    const dividend = Math.round((group.totalAmount - lowestBid.bidAmount) / group.totalMembers);

    // Persist winner announcement so all members see it on refresh
    const announcement = {
      month: group.currentMonth, groupId, groupName: group.name,
      winnerUserId: lowestBid.userId, winnerName,
      bidAmount: lowestBid.bidAmount, dividend,
      announcedAt: new Date().toISOString(), announcedBy: adminId,
    };
    await kv.set(`group:${groupId}:winner:${group.currentMonth}`, announcement);

    return c.json({ winner: lowestBid, dividend, announcement, winnerName });
  } catch (error) {
    console.log("Resolve bid error:", error);
    return c.json({ error: `Failed to resolve bid: ${error}` }, 500);
  }
});

// GET /groups/:groupId/winner — fetch winner announcement for current (or any) month
app.get("/make-server-ca64c5bf/groups/:groupId/winner", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const group: any = await kv.get(`group:${groupId}`);
    if (!group) return c.json({ announcement: null });
    const month = parseInt(c.req.query("month") || String(group.currentMonth));
    const announcement = await kv.get(`group:${groupId}:winner:${month}`);
    return c.json({ announcement: announcement || null });
  } catch (e) {
    return c.json({ error: `${e}` }, 500);
  }
});

// GET /groups/:groupId/winners — fetch all winners history for this group
app.get("/make-server-ca64c5bf/groups/:groupId/winners", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const allWinners: any[] = await kv.getByPrefix(`group:${groupId}:winner:`);
    const winners = allWinners
      .filter((w: any) => w && typeof w === "object" && w.month && w.winnerName)
      .sort((a: any, b: any) => b.month - a.month);
    return c.json({ winners });
  } catch (e) {
    return c.json({ error: `${e}` }, 500);
  }
});

// PATCH /groups/:groupId/winner/payment — admin records how much was sent to winner
app.patch("/make-server-ca64c5bf/groups/:groupId/winner/payment", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const adminId = c.get("userId");
    const { amountSent, sentTo, paymentNote, month } = await c.req.json();

    const requesterMember: any = await kv.get(`group:${groupId}:member:${adminId}`);
    if (!requesterMember || requesterMember.role !== "admin") {
      return c.json({ error: "Only admins can record winner payments" }, 403);
    }

    const group: any = await kv.get(`group:${groupId}`);
    if (!group) return c.json({ error: "Group not found" }, 404);

    const targetMonth = month || group.currentMonth;
    const announcement: any = await kv.get(`group:${groupId}:winner:${targetMonth}`);
    if (!announcement) return c.json({ error: "No winner announced for this month" }, 404);

    if (!amountSent || amountSent <= 0) return c.json({ error: "Enter a valid amount sent" }, 400);
    if (!sentTo?.trim()) return c.json({ error: "Enter the phone / UPI / account number" }, 400);

    const rebatePool = Math.max(0, group.totalAmount - amountSent);
    const rebatePerMember = Math.round(rebatePool / (group.totalMembers || 1));

    const updated = {
      ...announcement,
      amountSent,
      sentTo: sentTo.trim(),
      paymentNote: paymentNote?.trim() || "",
      rebatePool,
      rebatePerMember,
      paymentRecordedAt: new Date().toISOString(),
      paymentRecordedBy: adminId,
    };

    await kv.set(`group:${groupId}:winner:${targetMonth}`, updated);
    return c.json({ announcement: updated });
  } catch (error) {
    console.log("Record winner payment error:", error);
    return c.json({ error: `Failed to record payment: ${error}` }, 500);
  }
});

// POST /groups/:groupId/utr — member submits UTR number for their payment
app.post("/make-server-ca64c5bf/groups/:groupId/utr", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const groupId = c.req.param("groupId");
    const { utrNumber, month, amount } = await c.req.json();
    if (!utrNumber?.trim()) return c.json({ error: "UTR number is required" }, 400);
    const group: any = await kv.get(`group:${groupId}`);
    if (!group) return c.json({ error: "Group not found" }, 404);
    const memberRecord: any = await kv.get(`group:${groupId}:member:${userId}`);
    if (!memberRecord) return c.json({ error: "You are not a member of this group" }, 403);
    const targetMonth = month || group.currentMonth;
    const existing: any = await kv.get(`group:${groupId}:utr:${userId}:${targetMonth}`);
    const utr = {
      userId, groupId, memberName: memberRecord.name || "", memberEmail: memberRecord.email || "",
      utrNumber: utrNumber.trim(), month: targetMonth,
      amount: amount || group.monthlyContribution,
      status: "pending", submittedAt: new Date().toISOString(),
      verifiedAt: null, verifiedBy: null, note: "",
      previousUtr: existing?.utrNumber || null,
    };
    await kv.set(`group:${groupId}:utr:${userId}:${targetMonth}`, utr);
    console.log(`UTR ${utrNumber} submitted by ${userId} for group ${groupId} month ${targetMonth}`);
    return c.json({ utr });
  } catch (e) {
    console.log("UTR submit error:", e);
    return c.json({ error: `${e}` }, 500);
  }
});

// GET /groups/:groupId/utr — get UTR submissions (admin: all, member: own)
app.get("/make-server-ca64c5bf/groups/:groupId/utr", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const groupId = c.req.param("groupId");
    const group: any = await kv.get(`group:${groupId}`);
    if (!group) return c.json({ error: "Group not found" }, 404);
    const memberRecord: any = await kv.get(`group:${groupId}:member:${userId}`);
    const isAdmin = memberRecord?.role === "admin" || (await kv.get(`user:${userId}:role`)) === "admin";
    const all = await kv.getByPrefix(`group:${groupId}:utr:`);
    const utrs = all.filter((u: any) => u && u.utrNumber);
    if (isAdmin) return c.json({ utrs });
    return c.json({ utrs: utrs.filter((u: any) => u.userId === userId) });
  } catch (e) {
    return c.json({ error: `${e}` }, 500);
  }
});

// PATCH /groups/:groupId/utr/:memberId — admin verifies or rejects UTR
app.patch("/make-server-ca64c5bf/groups/:groupId/utr/:memberId", verifyAuth, async (c) => {
  try {
    const adminId = c.get("userId");
    const groupId = c.req.param("groupId");
    const memberId = c.req.param("memberId");
    const adminRole = await kv.get(`user:${adminId}:role`);
    if (adminRole !== "admin") return c.json({ error: "Admin only" }, 403);
    const { status, note, month } = await c.req.json();
    if (!["verified", "rejected"].includes(status)) return c.json({ error: "Status must be verified or rejected" }, 400);
    const group: any = await kv.get(`group:${groupId}`);
    const targetMonth = month || group?.currentMonth;
    const existing: any = await kv.get(`group:${groupId}:utr:${memberId}:${targetMonth}`);
    if (!existing) return c.json({ error: "UTR record not found" }, 404);
    const updated = { ...existing, status, note: note || "", verifiedAt: new Date().toISOString(), verifiedBy: adminId };
    await kv.set(`group:${groupId}:utr:${memberId}:${targetMonth}`, updated);
    // If verified, mark contribution as paid
    if (status === "verified") {
      const member: any = await kv.get(`group:${groupId}:member:${memberId}`);
      if (member) {
        member.contributionsPaid = (member.contributionsPaid || 0) + 1;
        await kv.set(`group:${groupId}:member:${memberId}`, member);
      }
    }
    console.log(`Admin ${adminId} ${status} UTR for member ${memberId} in group ${groupId} month ${targetMonth}`);
    return c.json({ utr: updated });
  } catch (e) {
    console.log("UTR verify error:", e);
    return c.json({ error: `${e}` }, 500);
  }
});

// ── Change Password ──
app.post("/make-server-ca64c5bf/auth/change-password", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { currentPassword, newPassword } = await c.req.json();

    const credentials = await kv.get(`user:${userId}:credentials`);
    if (!credentials) {
      return c.json({ error: "Account not found" }, 404);
    }

    // Verify current password by signing in
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: credentials.email,
      password: currentPassword,
    });
    if (signInError) {
      return c.json({ error: "Current password is incorrect" }, 400);
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (updateError) {
      console.log("Password update error:", updateError);
      return c.json({ error: "Failed to update password" }, 500);
    }

    return c.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.log("Change password exception:", error);
    return c.json({ error: `Failed to change password: ${error}` }, 500);
  }
});

// ── 2FA Setup: send OTP ──
app.post("/make-server-ca64c5bf/auth/2fa/setup", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const credentials = await kv.get(`user:${userId}:credentials`);
    if (!credentials) {
      return c.json({ error: "Account not found" }, 404);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await kv.set(`2fa:setup:${userId}`, {
      otp,
      expiry: Date.now() + 10 * 60 * 1000,
    });

    console.log(`2FA setup OTP for user ${userId}: ${otp}`);

    return c.json({
      success: true,
      otp, // demo only — in production send via SMS
      phone: credentials.phone,
    });
  } catch (error) {
    console.log("2FA setup exception:", error);
    return c.json({ error: `Failed to initiate 2FA setup: ${error}` }, 500);
  }
});

// ── 2FA Verify OTP ──
app.post("/make-server-ca64c5bf/auth/2fa/verify", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { otp } = await c.req.json();

    const setupData = await kv.get(`2fa:setup:${userId}`);
    if (!setupData) {
      return c.json({ error: "No 2FA setup in progress. Please request a new code." }, 400);
    }
    if (Date.now() > setupData.expiry) {
      await kv.del(`2fa:setup:${userId}`);
      return c.json({ error: "Code has expired. Please request a new one." }, 400);
    }
    if (setupData.otp !== otp) {
      return c.json({ error: "Incorrect verification code" }, 400);
    }

    await kv.set(`user:${userId}:2fa`, { enabled: true, enabledAt: new Date().toISOString() });
    await kv.del(`2fa:setup:${userId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log("2FA verify exception:", error);
    return c.json({ error: `Failed to verify 2FA: ${error}` }, 500);
  }
});

// ── 2FA Status ──
app.get("/make-server-ca64c5bf/auth/2fa/status", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const twoFA = await kv.get(`user:${userId}:2fa`);
    return c.json({ enabled: twoFA?.enabled ?? false });
  } catch (error) {
    return c.json({ enabled: false });
  }
});

// ── Save Transaction ──
app.post("/make-server-ca64c5bf/transactions", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const txnId = crypto.randomUUID();
    const transaction = {
      id: txnId,
      userId,
      groupId: body.groupId || null,
      groupName: body.groupName || "",
      amount: body.amount,
      recipientUpiId: body.recipientUpiId,
      recipientName: body.recipientName || "",
      appUsed: body.appUsed,
      status: body.status, // "success" | "failed"
      month: body.month || null,
      note: body.note || "",
      createdAt: new Date().toISOString(),
    };
    await kv.set(`transaction:${txnId}`, transaction);
    await kv.set(`user:${userId}:transaction:${txnId}`, txnId);
    if (body.groupId) {
      await kv.set(`group:${body.groupId}:transaction:${txnId}`, txnId);
    }
    return c.json({ transaction });
  } catch (error) {
    console.log("Save transaction error:", error);
    return c.json({ error: `Failed to save transaction: ${error}` }, 500);
  }
});

// ── Get User Transactions ──
app.get("/make-server-ca64c5bf/transactions", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const txnIds = await kv.getByPrefix(`user:${userId}:transaction:`);
    const transactions: any[] = [];
    for (const txnId of txnIds) {
      const txn = await kv.get(`transaction:${txnId}`);
      if (txn) transactions.push(txn);
    }
    transactions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return c.json({ transactions });
  } catch (error) {
    console.log("Get transactions error:", error);
    return c.json({ error: `Failed to fetch transactions: ${error}` }, 500);
  }
});

// ── Delete All User Transactions ──
app.delete("/make-server-ca64c5bf/transactions", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const txnIds = await kv.getByPrefix(`user:${userId}:transaction:`);
    for (const txnId of txnIds) {
      await kv.del(`transaction:${txnId}`);
      await kv.del(`user:${userId}:transaction:${txnId}`);
    }
    // Also clear pending payments
    const paymentIds = await kv.getByPrefix(`user:${userId}:payment:`);
    for (const payId of paymentIds) {
      await kv.del(`payment:${payId}`);
      await kv.del(`user:${userId}:payment:${payId}`);
    }
    return c.json({ deleted: txnIds.length, message: "All transactions cleared" });
  } catch (error) {
    console.log("Delete transactions error:", error);
    return c.json({ error: `Failed to delete transactions: ${error}` }, 500);
  }
});

// ── Get Group Transactions ──
app.get("/make-server-ca64c5bf/groups/:groupId/transactions", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const txnIds = await kv.getByPrefix(`group:${groupId}:transaction:`);
    const transactions: any[] = [];
    for (const txnId of txnIds) {
      const txn = await kv.get(`transaction:${txnId}`);
      if (txn) transactions.push(txn);
    }
    transactions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return c.json({ transactions });
  } catch (error) {
    console.log("Get group transactions error:", error);
    return c.json({ error: `Failed to fetch group transactions: ${error}` }, 500);
  }
});

// ── Helper: fully delete a group ──
async function purgeGroup(groupId: string) {
  const members = await kv.getByPrefix(`group:${groupId}:member:`);
  for (const member of members) {
    const uid = member.userId || member.id;
    await kv.del(`user:${uid}:group:${groupId}`);
    await kv.del(`group:${groupId}:member:${uid}`);
  }
  await kv.del(`group:${groupId}:delete-request`);
  await kv.del(`group:${groupId}`);
}

// ── Create Delete Request (admin only) ──
app.post("/make-server-ca64c5bf/groups/:groupId/delete-request", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const requesterId = c.get("userId");

    const requesterMember = await kv.get(`group:${groupId}:member:${requesterId}`);
    if (!requesterMember || requesterMember.role !== "admin") {
      return c.json({ error: "Only group admins can request deletion" }, 403);
    }

    const group = await kv.get(`group:${groupId}`);
    if (!group) return c.json({ error: "Group not found" }, 404);

    const members = await kv.getByPrefix(`group:${groupId}:member:`);
    const totalMembers = members.length;

    const deleteRequest = {
      groupId,
      requestedBy: requesterId,
      requestedByName: requesterMember.name || "Admin",
      requestedAt: new Date().toISOString(),
      approvals: [requesterId], // admin auto-approves
      totalMembers,
    };

    await kv.set(`group:${groupId}:delete-request`, deleteRequest);

    // If admin is the only member, delete immediately
    if (totalMembers <= 1) {
      await purgeGroup(groupId);
      return c.json({ deleted: true, deleteRequest });
    }

    return c.json({ deleted: false, deleteRequest });
  } catch (error) {
    console.log("Delete request error:", error);
    return c.json({ error: `Failed to create delete request: ${error}` }, 500);
  }
});

// ── Get Delete Request Status ──
app.get("/make-server-ca64c5bf/groups/:groupId/delete-request", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const deleteRequest = await kv.get(`group:${groupId}:delete-request`);
    return c.json({ deleteRequest: deleteRequest || null });
  } catch (error) {
    return c.json({ deleteRequest: null });
  }
});

// ── Approve Delete Request (any member) ──
app.post("/make-server-ca64c5bf/groups/:groupId/delete-request/approve", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const userId = c.get("userId");

    const deleteRequest = await kv.get(`group:${groupId}:delete-request`);
    if (!deleteRequest) return c.json({ error: "No active delete request found" }, 404);

    if (deleteRequest.approvals.includes(userId)) {
      return c.json({ error: "You have already approved this deletion" }, 400);
    }

    deleteRequest.approvals.push(userId);

    // If all members have approved, delete the group
    if (deleteRequest.approvals.length >= deleteRequest.totalMembers) {
      await purgeGroup(groupId);
      return c.json({ deleted: true, deleteRequest });
    }

    await kv.set(`group:${groupId}:delete-request`, deleteRequest);
    return c.json({ deleted: false, deleteRequest });
  } catch (error) {
    console.log("Approve delete error:", error);
    return c.json({ error: `Failed to approve deletion: ${error}` }, 500);
  }
});

// ── Cancel Delete Request (admin who created it) ──
app.delete("/make-server-ca64c5bf/groups/:groupId/delete-request", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const userId = c.get("userId");

    const deleteRequest = await kv.get(`group:${groupId}:delete-request`);
    if (!deleteRequest) return c.json({ error: "No active delete request" }, 404);

    if (deleteRequest.requestedBy !== userId) {
      return c.json({ error: "Only the admin who requested deletion can cancel it" }, 403);
    }

    await kv.del(`group:${groupId}:delete-request`);
    return c.json({ success: true });
  } catch (error) {
    console.log("Cancel delete error:", error);
    return c.json({ error: `Failed to cancel delete request: ${error}` }, 500);
  }
});

// ── Group Alerts: send broadcast message to all members ──
app.post("/make-server-ca64c5bf/groups/:groupId/alerts", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const userId = c.get("userId");
    const { message, alertType } = await c.req.json();

    if (!message || !message.trim()) {
      return c.json({ error: "Message cannot be empty" }, 400);
    }

    const senderMember = await kv.get(`group:${groupId}:member:${userId}`);
    if (!senderMember || senderMember.role !== "admin") {
      return c.json({ error: "Only group admins can broadcast alerts" }, 403);
    }

    const alertId = crypto.randomUUID();
    const alert = {
      id: alertId,
      groupId,
      sentBy: userId,
      sentByName: senderMember.name || "Admin",
      message: message.trim(),
      alertType: alertType || "info", // info | warning | payment | urgent | success
      createdAt: new Date().toISOString(),
    };

    await kv.set(`group:${groupId}:alert:${alertId}`, alert);
    return c.json({ alert });
  } catch (error) {
    console.log("Send alert error:", error);
    return c.json({ error: `Failed to send alert: ${error}` }, 500);
  }
});

app.get("/make-server-ca64c5bf/groups/:groupId/alerts", verifyAuth, async (c) => {
  try {
    const groupId = c.req.param("groupId");
    const alerts = await kv.getByPrefix(`group:${groupId}:alert:`);
    alerts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json({ alerts });
  } catch (error) {
    console.log("Get alerts error:", error);
    return c.json({ error: `Failed to fetch alerts: ${error}` }, 500);
  }
});

// Delete ALL groups owned by the current user
app.delete("/make-server-ca64c5bf/groups/all", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const groupIdEntries = await kv.getByPrefix(`user:${userId}:group:`);
    let deleted = 0;
    for (const groupId of groupIdEntries) {
      const group = await kv.get(`group:${groupId}`);
      if (group && group.createdBy === userId) {
        await purgeGroup(groupId);
        deleted++;
      }
    }
    return c.json({ success: true, deleted });
  } catch (e) {
    console.log("Delete all groups error:", e);
    return c.json({ error: `Failed to delete groups: ${e}` }, 500);
  }
});

// Demo Seeder: generate fake groups, members, and payments for the logged-in user
app.post("/make-server-ca64c5bf/demo/seed", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const creds = await kv.get(`user:${userId}:credentials`);
    const userName = creds?.name || "Demo User";
    const userUpi = `${(creds?.name || "user").toLowerCase().replace(/\s+/g, "")}@okaxis`;

    const fakeNames = [
      { name: "Ravi Kumar", upi: "ravi.kumar@okaxis" },
      { name: "Priya Sharma", upi: "priya.sharma@paytm" },
      { name: "Suresh Patel", upi: "suresh.patel@okicici" },
      { name: "Anita Devi", upi: "anita.devi@ybl" },
      { name: "Manoj Verma", upi: "manoj.verma@okhdfc" },
      { name: "Sunita Rao", upi: "sunita.rao@upi" },
    ];

    const demoGroups = [
      { name: "Gold Savings Chit", totalMembers: 10, monthlyContribution: 5000, duration: 10, month: 4 },
      { name: "Family Fund 2024", totalMembers: 8, monthlyContribution: 2000, duration: 8, month: 3 },
    ];

    const createdGroups: any[] = [];

    for (const gDef of demoGroups) {
      const groupId = crypto.randomUUID();
      const group = {
        id: groupId,
        name: gDef.name,
        totalMembers: gDef.totalMembers,
        monthlyContribution: gDef.monthlyContribution,
        duration: gDef.duration,
        totalAmount: gDef.totalMembers * gDef.monthlyContribution,
        startDate: new Date(Date.now() - gDef.month * 30 * 86400000).toISOString().split("T")[0],
        nextBidDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        organizerUpiId: userUpi,
        organizerName: userName,
        createdBy: userId,
        createdAt: new Date(Date.now() - gDef.month * 30 * 86400000).toISOString(),
        currentMonth: gDef.month,
        status: "active",
        members: [userId],
      };

      await kv.set(`group:${groupId}`, group);
      await kv.set(`user:${userId}:group:${groupId}`, groupId);

      // Creator as admin member
      await kv.set(`group:${groupId}:member:${userId}`, {
        id: userId, userId, groupId,
        name: userName, email: creds?.email || "", phone: creds?.phone || "",
        role: "admin", joinedDate: group.createdAt, addedBy: userId,
        contributionsPaid: gDef.month, hasWonBid: false,
      });

      // Fake members
      for (const fm of fakeNames.slice(0, Math.min(4, gDef.totalMembers - 1))) {
        const fmId = crypto.randomUUID();
        const paidMonths = Math.floor(Math.random() * gDef.month) + 1;
        await kv.set(`group:${groupId}:member:${fmId}`, {
          id: fmId, userId: fmId, groupId,
          name: fm.name,
          email: `${fm.name.toLowerCase().replace(/\s+/g, "")}@demo.com`,
          phone: `98${Math.floor(10000000 + Math.random() * 89999999)}`,
          role: "member", joinedDate: group.createdAt, addedBy: userId,
          contributionsPaid: paidMonths, hasWonBid: false,
        });
      }

      // Fake past contributions + transactions (one per month)
      const methods = ["gpay", "phonepe", "paytm"];
      for (let month = 1; month <= gDef.month; month++) {
        const paidAt = new Date(Date.now() - (gDef.month - month) * 30 * 86400000).toISOString();
        const utr = Math.floor(100000000000 + Math.random() * 899999999999).toString();

        const cId = crypto.randomUUID();
        await kv.set(`group:${groupId}:contribution:${cId}`, {
          id: cId, groupId, userId, memberName: userName,
          amount: gDef.monthlyContribution, month,
          dueDate: paidAt.split("T")[0], paidDate: paidAt.split("T")[0],
          status: "paid", paymentMethod: methods[month % 3],
          note: `Month ${month} – ${gDef.name}`, utrNumber: utr, createdAt: paidAt,
        });

        const tId = crypto.randomUUID();
        await kv.set(`transaction:${tId}`, {
          id: tId, userId, groupId, groupName: gDef.name,
          amount: gDef.monthlyContribution,
          recipientUpiId: userUpi, recipientName: userName,
          appUsed: methods[month % 3], utrNumber: utr,
          status: "success", month,
          note: `Month ${month} – ${gDef.name}`, createdAt: paidAt,
        });
        await kv.set(`user:${userId}:transaction:${tId}`, tId);
        await kv.set(`group:${groupId}:transaction:${tId}`, tId);
      }

      // Seed one fake failed payment too
      const failedTId = crypto.randomUUID();
      await kv.set(`transaction:${failedTId}`, {
        id: failedTId, userId, groupId, groupName: gDef.name,
        amount: gDef.monthlyContribution,
        recipientUpiId: userUpi, recipientName: userName,
        appUsed: "gpay", utrNumber: null,
        status: "failed", month: gDef.month,
        note: `Failed payment – ${gDef.name}`,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      });
      await kv.set(`user:${userId}:transaction:${failedTId}`, failedTId);
      await kv.set(`group:${groupId}:transaction:${failedTId}`, failedTId);

      // Seed welcome + payment-due alerts
      const dueDate = new Date(Date.now() + 5 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "long" });
      const alertWelcome = crypto.randomUUID();
      await kv.set(`group:${groupId}:alert:${alertWelcome}`, {
        id: alertWelcome, groupId, sentBy: userId, sentByName: userName,
        message: `Welcome to ${gDef.name}! This group has ${gDef.totalMembers} members contributing ₹${gDef.monthlyContribution.toLocaleString()} every month. Please pay on time to keep the group healthy.`,
        alertType: "info",
        createdAt: new Date(Date.now() - gDef.month * 30 * 86400000 + 60000).toISOString(),
      });

      const alertDue = crypto.randomUUID();
      await kv.set(`group:${groupId}:alert:${alertDue}`, {
        id: alertDue, groupId, sentBy: userId, sentByName: userName,
        message: `⏰ Reminder: Month ${gDef.month + 1} contribution of ₹${gDef.monthlyContribution.toLocaleString()} is due by ${dueDate}. Please pay via GPay, PhonePe, or Paytm. Contact admin for help.`,
        alertType: "payment",
        createdAt: new Date().toISOString(),
      });

      createdGroups.push(group);
    }

    return c.json({ groups: createdGroups, message: "Demo data seeded successfully" });
  } catch (error) {
    console.log("Demo seed error:", error);
    return c.json({ error: `Failed to seed demo data: ${error}` }, 500);
  }
});

// ── Initiate Payment (creates a pending record before QR/app is shown) ──
app.post("/make-server-ca64c5bf/payments/initiate", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const paymentId = crypto.randomUUID();
    const shortRef = "CHF" + paymentId.slice(0, 8).toUpperCase();

    const payment = {
      id: paymentId,
      shortRef,
      userId,
      groupId: body.groupId || null,
      groupName: body.groupName || "",
      amount: body.amount,
      recipientUpiId: body.recipientUpiId,
      recipientName: body.recipientName || "",
      month: body.month || null,
      note: body.note || "",
      status: "pending", // pending | success | failed | expired
      utrNumber: null,
      appUsed: null,
      initiatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min window
      confirmedAt: null,
    };

    await kv.set(`payment:${paymentId}`, payment);
    await kv.set(`user:${userId}:payment:${paymentId}`, paymentId);
    if (body.groupId) {
      await kv.set(`group:${body.groupId}:payment:${paymentId}`, paymentId);
    }

    return c.json({ payment });
  } catch (error) {
    console.log("Initiate payment error:", error);
    return c.json({ error: `Failed to initiate payment: ${error}` }, 500);
  }
});

// ── List All Payments for Current User (pending + confirmed + expired) ──
app.get("/make-server-ca64c5bf/payments", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const paymentIds = await kv.getByPrefix(`user:${userId}:payment:`);
    const payments: any[] = [];
    for (const paymentId of paymentIds) {
      const p = await kv.get(`payment:${paymentId}`);
      if (p) {
        // Auto-expire stale pending payments
        if (p.status === "pending" && new Date() > new Date(p.expiresAt)) {
          p.status = "expired";
          await kv.set(`payment:${paymentId}`, p);
        }
        payments.push(p);
      }
    }
    payments.sort((a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime());
    return c.json({ payments });
  } catch (error) {
    console.log("Get payments error:", error);
    return c.json({ error: `Failed to fetch payments: ${error}` }, 500);
  }
});

// ── Login History for Current User ──
app.get("/make-server-ca64c5bf/auth/login-history", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const events = await kv.getByPrefix(`user:${userId}:loginEvent:`);
    events.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return c.json({ events: events.slice(0, 50) }); // last 50
  } catch (error) {
    return c.json({ events: [] });
  }
});

// ── Poll Payment Status (frontend polls every 3 s for real-time updates) ──
app.get("/make-server-ca64c5bf/payments/:paymentId", verifyAuth, async (c) => {
  try {
    const paymentId = c.req.param("paymentId");
    const payment = await kv.get(`payment:${paymentId}`);
    if (!payment) return c.json({ error: "Payment not found" }, 404);

    // Auto-expire if window passed
    if (payment.status === "pending" && new Date() > new Date(payment.expiresAt)) {
      payment.status = "expired";
      await kv.set(`payment:${paymentId}`, payment);
    }

    return c.json({ payment });
  } catch (error) {
    console.log("Get payment status error:", error);
    return c.json({ error: `Failed to get payment status: ${error}` }, 500);
  }
});

// ── Confirm Payment (validates UTR, saves transaction + contribution atomically) ──
app.post("/make-server-ca64c5bf/payments/:paymentId/confirm", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const paymentId = c.req.param("paymentId");
    const { status, utrNumber, appUsed } = await c.req.json();

    const payment = await kv.get(`payment:${paymentId}`);
    if (!payment) return c.json({ error: "Payment not found" }, 404);

    if (payment.status !== "pending") {
      return c.json({ error: "This payment has already been processed" }, 400);
    }

    // Validate and deduplicate UTR when provided with a successful payment
    const trimmedUtr = (utrNumber || "").trim();
    if (status === "success" && trimmedUtr) {
      if (!/^\d{12}$/.test(trimmedUtr)) {
        return c.json({ error: "Invalid UTR number. It must be exactly 12 digits (found in your UPI app)." }, 400);
      }
      const existingUtr = await kv.get(`utr:${trimmedUtr}`);
      if (existingUtr) {
        return c.json({ error: "This UTR number has already been recorded. If you believe this is wrong, contact support." }, 400);
      }
      await kv.set(`utr:${trimmedUtr}`, paymentId);
    }

    // Update payment record
    payment.status = status;
    payment.utrNumber = trimmedUtr || null;
    payment.appUsed = appUsed || "upi_qr";
    payment.confirmedAt = new Date().toISOString();
    await kv.set(`payment:${paymentId}`, payment);

    // Create transaction record
    const txnId = crypto.randomUUID();
    const transaction = {
      id: txnId,
      userId,
      paymentId,
      shortRef: payment.shortRef,
      groupId: payment.groupId,
      groupName: payment.groupName,
      amount: payment.amount,
      recipientUpiId: payment.recipientUpiId,
      recipientName: payment.recipientName,
      appUsed: appUsed || "upi_qr",
      utrNumber: trimmedUtr || null,
      status,
      month: payment.month,
      note: payment.note,
      createdAt: new Date().toISOString(),
    };
    await kv.set(`transaction:${txnId}`, transaction);
    await kv.set(`user:${userId}:transaction:${txnId}`, txnId);
    if (payment.groupId) {
      await kv.set(`group:${payment.groupId}:transaction:${txnId}`, txnId);
    }

    // Auto-record contribution on success
    let contribution = null;
    if (status === "success" && payment.groupId) {
      const contributionId = crypto.randomUUID();
      const today = new Date().toISOString().split("T")[0];
      contribution = {
        id: contributionId,
        groupId: payment.groupId,
        userId,
        memberName: payment.recipientName || "",
        amount: payment.amount,
        month: payment.month,
        dueDate: today,
        paidDate: today,
        status: "paid",
        paymentMethod: appUsed || "upi_qr",
        note: payment.note,
        transactionId: txnId,
        utrNumber: trimmedUtr || null,
        createdAt: new Date().toISOString(),
      };
      await kv.set(`group:${payment.groupId}:contribution:${contributionId}`, contribution);

      const member = await kv.get(`group:${payment.groupId}:member:${userId}`);
      if (member) {
        member.contributionsPaid = (member.contributionsPaid || 0) + 1;
        await kv.set(`group:${payment.groupId}:member:${userId}`, member);
      }
    }

    return c.json({ payment, transaction, contribution });
  } catch (error) {
    console.log("Confirm payment error:", error);
    return c.json({ error: `Failed to confirm payment: ${error}` }, 500);
  }
});

// ── Razorpay Payment Gateway ─────────────────────────────────────────────────

// Create Razorpay order
app.post("/make-server-ca64c5bf/payments/razorpay/order", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) return c.json({ error: "Unauthorized" }, 401);

    const { amount, groupId, groupName, month, memberName, note } = await c.req.json();
    if (!amount || amount <= 0) return c.json({ error: "Invalid amount" }, 400);

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) return c.json({ error: "Razorpay keys not configured on server" }, 500);

    const shortRef = "CHF" + Math.random().toString(36).substring(2, 9).toUpperCase();
    const amountInPaise = Math.round(amount * 100); // Razorpay uses smallest currency unit

    const auth = btoa(`${keyId}:${keySecret}`);
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: shortRef,
        notes: { groupId: groupId || "", groupName: groupName || "", month: String(month || 1), memberName: memberName || "", note: note || "" },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.log("Razorpay create order error:", JSON.stringify(data));
      return c.json({ error: data.error?.description || "Failed to create Razorpay order" }, 500);
    }

    console.log("Razorpay order created:", data.id);
    return c.json({ orderId: data.id, amount: data.amount, currency: data.currency, keyId, shortRef });
  } catch (e) {
    console.log("Razorpay order exception:", e);
    return c.json({ error: `Order creation failed: ${e}` }, 500);
  }
});

// Verify Razorpay payment signature and save transaction
app.post("/make-server-ca64c5bf/payments/razorpay/verify", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) return c.json({ error: "Unauthorized" }, 401);

    const {
      razorpay_payment_id, razorpay_order_id, razorpay_signature,
      groupId, groupName, amount, month, note, memberName,
    } = await c.req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return c.json({ error: "Missing Razorpay fields" }, 400);
    }

    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) return c.json({ error: "Razorpay not configured" }, 500);

    // HMAC-SHA256 signature verification
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw", encoder.encode(keySecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`));
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

    if (expected !== razorpay_signature) {
      console.log("Razorpay signature mismatch — possible tampered response");
      return c.json({ error: "Payment verification failed: signature mismatch" }, 400);
    }

    // Save transaction
    const userId = user.id;
    const txnId = crypto.randomUUID();
    const transaction = {
      id: txnId,
      userId,
      groupId: groupId || null,
      groupName: groupName || "",
      amount,
      month: month || 1,
      note: note || "",
      recipientUpiId: null,
      recipientName: memberName || "",
      appUsed: "razorpay",
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      status: "success",
      createdAt: new Date().toISOString(),
    };
    await kv.set(`transaction:${txnId}`, transaction);
    await kv.set(`user:${userId}:transaction:${txnId}`, txnId);
    if (groupId) await kv.set(`group:${groupId}:transaction:${txnId}`, txnId);

    // Auto-record contribution
    if (groupId) {
      const today = new Date().toISOString().split("T")[0];
      const contributionId = crypto.randomUUID();
      const contribution = {
        id: contributionId, groupId, userId, memberName: memberName || "",
        amount, month: month || 1, dueDate: today, paidDate: today,
        status: "paid", paymentMethod: "razorpay",
        transactionId: txnId, razorpayPaymentId: razorpay_payment_id,
        createdAt: new Date().toISOString(),
      };
      await kv.set(`group:${groupId}:contribution:${contributionId}`, contribution);
      const member = await kv.get(`group:${groupId}:member:${userId}`);
      if (member) {
        member.contributionsPaid = (member.contributionsPaid || 0) + 1;
        await kv.set(`group:${groupId}:member:${userId}`, member);
      }
    }

    console.log("Razorpay payment verified and saved:", txnId);
    return c.json({ success: true, transaction });
  } catch (e) {
    console.log("Razorpay verify exception:", e);
    return c.json({ error: `Verification failed: ${e}` }, 500);
  }
});

// ── Member Documents ─────────────────────────────────────────────────────────

// Upload profile photo or Aadhaar card (own docs only, or admin)
app.post("/make-server-ca64c5bf/members/:memberId/documents", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) return c.json({ error: "Unauthorized" }, 401);

    const memberId = c.req.param("memberId");
    if (memberId !== user.id) {
      // only allow admin users to upload for others (check if user is admin of any group)
      const allEntries: any[] = await kv.getByPrefix(`group:`);
      const isAnyAdmin = allEntries.some((entry: any) =>
        entry && typeof entry === "object" && entry.userId === user.id && entry.role === "admin"
      );
      if (!isAnyAdmin) return c.json({ error: "Forbidden: can only upload your own documents" }, 403);
    }

    const formData = await c.req.formData();
    const docType = formData.get("docType") as string;
    const file = formData.get("file") as File | null;

    if (!docType || !["profilePhoto", "aadhaarCard"].includes(docType)) {
      return c.json({ error: "docType must be profilePhoto or aadhaarCard" }, 400);
    }
    if (!file) return c.json({ error: "No file provided" }, 400);
    if (file.size > 5 * 1024 * 1024) return c.json({ error: "File too large (max 5 MB)" }, 400);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const storageKey = `members/${memberId}/${docType}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(DOCS_BUCKET)
      .upload(storageKey, bytes, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.log("Storage upload error:", uploadError);
      return c.json({ error: `Upload failed: ${uploadError.message}` }, 500);
    }

    const existing = (await kv.get(`user:${memberId}:documents`)) || {};
    existing[docType] = { storageKey, uploadedAt: new Date().toISOString(), fileType: file.type };
    await kv.set(`user:${memberId}:documents`, existing);

    return c.json({ success: true, docType, storageKey });
  } catch (e) {
    console.log("Document upload error:", e);
    return c.json({ error: `Upload failed: ${e}` }, 500);
  }
});

// Get signed URLs for a member's documents (access controlled per group)
app.get("/make-server-ca64c5bf/groups/:groupId/members/:memberId/documents", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) return c.json({ error: "Unauthorized" }, 401);

    const groupId = c.req.param("groupId");
    const memberId = c.req.param("memberId");

    // Determine requester's role in this group
    const requesterMember = await kv.get(`group:${groupId}:member:${user.id}`);
    const requesterRole = requesterMember?.role || "member";

    // Access control:
    // - Admin → can view any member's docs
    // - Member → can only view docs of members who are admin in this group
    if (requesterRole !== "admin") {
      const targetMember = await kv.get(`group:${groupId}:member:${memberId}`);
      if (!targetMember || targetMember.role !== "admin") {
        return c.json({ error: "Forbidden: members can only view admin documents" }, 403);
      }
    }

    const docs = (await kv.get(`user:${memberId}:documents`)) || {};
    const result: Record<string, any> = {};

    for (const [docType, info] of Object.entries(docs) as [string, any][]) {
      if (info?.storageKey) {
        const { data: signedData, error: signErr } = await supabase.storage
          .from(DOCS_BUCKET)
          .createSignedUrl(info.storageKey, 60 * 30); // 30-min URL
        if (!signErr && signedData?.signedUrl) {
          result[docType] = { url: signedData.signedUrl, uploadedAt: info.uploadedAt };
        }
      }
    }

    return c.json({ documents: result });
  } catch (e) {
    console.log("Get documents error:", e);
    return c.json({ error: `Failed to fetch documents: ${e}` }, 500);
  }
});

// Delete a document (own docs, or admin)
app.delete("/make-server-ca64c5bf/members/:memberId/documents/:docType", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) return c.json({ error: "Unauthorized" }, 401);

    const memberId = c.req.param("memberId");
    const docType = c.req.param("docType");

    if (memberId !== user.id) {
      const allEntries: any[] = await kv.getByPrefix(`group:`);
      const isAnyAdmin = allEntries.some((entry: any) =>
        entry && typeof entry === "object" && entry.userId === user.id && entry.role === "admin"
      );
      if (!isAnyAdmin) return c.json({ error: "Forbidden" }, 403);
    }

    const docs = (await kv.get(`user:${memberId}:documents`)) || {};
    const info = docs[docType];
    if (!info?.storageKey) return c.json({ error: "Document not found" }, 404);

    await supabase.storage.from(DOCS_BUCKET).remove([info.storageKey]);
    delete docs[docType];
    await kv.set(`user:${memberId}:documents`, docs);

    return c.json({ success: true });
  } catch (e) {
    console.log("Delete document error:", e);
    return c.json({ error: `Delete failed: ${e}` }, 500);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN PAYMENT COLLECTION
// ══════════════════════════════════════════════════════════════════════════════

// Get all members' payment status for a specific month
app.get("/make-server-ca64c5bf/admin/group-payments", verifyAuth, verifyAdmin, async (c) => {
  try {
    const groupId = c.req.query("groupId");
    const month = parseInt(c.req.query("month") || "1");

    if (!groupId) {
      return c.json({ error: "Group ID is required" }, 400);
    }

    // Get all group members
    const group = await kv.get(`chitGroup:${groupId}`);
    if (!group) {
      return c.json({ error: "Group not found" }, 404);
    }

    const memberIds = group.members || [];
    const payments: any[] = [];

    for (const memberId of memberIds) {
      const memberCreds = await kv.get(`user:${memberId}:credentials`);
      const memberName = memberCreds?.name || "Unknown";

      // Check if payment exists for this month
      const contributionKey = `contribution:${groupId}:${memberId}:${month}`;
      const contribution = await kv.get(contributionKey);

      payments.push({
        memberId,
        memberName,
        amount: group.monthlyContribution,
        status: contribution?.status || "pending",
        utrNumber: contribution?.utrNumber,
        paidDate: contribution?.paidDate,
        contributionId: contributionKey,
      });
    }

    return c.json({ payments });
  } catch (error) {
    console.log("Get group payments error:", error);
    return c.json({ error: `Failed to load payments: ${error}` }, 500);
  }
});

// Verify a member's payment with UTR
app.post("/make-server-ca64c5bf/admin/verify-payment", verifyAuth, verifyAdmin, async (c) => {
  try {
    const { groupId, memberId, month, utrNumber, amount } = await c.req.json();

    if (!groupId || !memberId || !month || !utrNumber) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    if (!/^\d{12}$/.test(utrNumber)) {
      return c.json({ error: "UTR must be exactly 12 digits" }, 400);
    }

    const contributionKey = `contribution:${groupId}:${memberId}:${month}`;
    const txnId = crypto.randomUUID();

    // Create/update contribution record
    await kv.set(contributionKey, {
      id: contributionKey,
      groupId,
      userId: memberId,
      month,
      amount,
      utrNumber,
      status: "verified",
      paidDate: new Date().toISOString(),
      verifiedBy: c.get("userId"),
      verifiedAt: new Date().toISOString(),
    });

    // Also create a transaction record
    const transaction = {
      id: txnId,
      userId: memberId,
      groupId,
      amount,
      type: "contribution",
      month,
      utrNumber,
      status: "verified",
      createdAt: new Date().toISOString(),
      verifiedBy: c.get("userId"),
    };
    await kv.set(`transaction:${txnId}`, transaction);

    return c.json({ success: true, contribution: contributionKey });
  } catch (error) {
    console.log("Verify payment error:", error);
    return c.json({ error: `Failed to verify payment: ${error}` }, 500);
  }
});

// Mark entire month as complete after all UTRs collected
app.post("/make-server-ca64c5bf/admin/mark-month-complete", verifyAuth, verifyAdmin, async (c) => {
  try {
    const { groupId, month } = await c.req.json();

    if (!groupId || !month) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Update group with month completion status
    const completionKey = `group:${groupId}:month:${month}:complete`;
    await kv.set(completionKey, {
      completedAt: new Date().toISOString(),
      completedBy: c.get("userId"),
    });

    return c.json({ success: true, message: `Month ${month} marked as complete` });
  } catch (error) {
    console.log("Mark month complete error:", error);
    return c.json({ error: `Failed to mark month complete: ${error}` }, 500);
  }
});


// POST /groups/:groupId/join-requests/:targetUserId/accept
app.post("/make-server-ca64c5bf/groups/:groupId/join-requests/:targetUserId/accept", verifyAuth, async (c) => {
  try {
    const adminId = c.get("userId");
    const userRole = await kv.get(`user:${adminId}:role`);
    if (userRole !== "admin") return c.json({ error: "Admin only" }, 403);
    const groupId = c.req.param("groupId");
    const targetUserId = c.req.param("targetUserId");
    const request: any = await kv.get(`group:${groupId}:joinRequest:${targetUserId}`);
    if (!request) return c.json({ error: "Request not found" }, 404);
    const now = new Date().toISOString();
    const member = {
      id: targetUserId, userId: targetUserId, groupId,
      name: request.userName, email: request.email, phone: request.phone,
      role: "member", joinedDate: now, addedBy: adminId, contributionsPaid: 0, hasWonBid: false,
    };
    await kv.set(`group:${groupId}:member:${targetUserId}`, member);
    await kv.set(`user:${targetUserId}:group:${groupId}`, groupId);
    const updated = { ...request, status: "accepted", updatedAt: now };
    await kv.set(`group:${groupId}:joinRequest:${targetUserId}`, updated);
    console.log(`Admin ${adminId} accepted ${targetUserId} into group ${groupId}`);
    return c.json({ member, request: updated });
  } catch (e) {
    return c.json({ error: `${e}` }, 500);
  }
});

// POST /groups/:groupId/join-requests/:targetUserId/reject
app.post("/make-server-ca64c5bf/groups/:groupId/join-requests/:targetUserId/reject", verifyAuth, async (c) => {
  try {
    const adminId = c.get("userId");
    const userRole = await kv.get(`user:${adminId}:role`);
    if (userRole !== "admin") return c.json({ error: "Admin only" }, 403);
    const groupId = c.req.param("groupId");
    const targetUserId = c.req.param("targetUserId");
    const request: any = await kv.get(`group:${groupId}:joinRequest:${targetUserId}`);
    if (!request) return c.json({ error: "Request not found" }, 404);
    const updated = { ...request, status: "rejected", updatedAt: new Date().toISOString() };
    await kv.set(`group:${groupId}:joinRequest:${targetUserId}`, updated);
    return c.json({ request: updated });
  } catch (e) {
    return c.json({ error: `${e}` }, 500);
  }
});

// GET /user/join-request-status/:groupId — member checks their request status
app.get("/make-server-ca64c5bf/user/join-request-status/:groupId", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const groupId = c.req.param("groupId");
    const request = await kv.get(`group:${groupId}:joinRequest:${userId}`);
    return c.json({ request: request || null });
  } catch (e) {
    return c.json({ error: `${e}` }, 500);
  }
});

// ── KYC ───────────────────────────────────────────────────────────────────────

// GET /kyc/my  — fetch current user's KYC record
app.get("/make-server-ca64c5bf/kyc/my", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const record = await kv.get(`kyc:${userId}`);
    return c.json({ kyc: record || null });
  } catch (e) {
    return c.json({ error: `${e}` }, 500);
  }
});

// POST /kyc/save  — upsert personal details + documents (base64)
app.post("/make-server-ca64c5bf/kyc/save", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const existing: any = await kv.get(`kyc:${userId}`) || {};
    const now = new Date().toISOString();
    const updated = {
      ...existing,
      userId,
      userEmail: body.userEmail ?? existing.userEmail,
      userName: body.userName ?? existing.userName,
      userRole: body.userRole ?? existing.userRole,
      personalDetails: { ...(existing.personalDetails || {}), ...(body.personalDetails || {}) },
      documents: { ...(existing.documents || {}), ...(body.documents || {}) },
      status: existing.status === "approved" ? "approved" : (existing.status || "draft"),
      createdAt: existing.createdAt || now,
      updatedAt: now,
    };
    await kv.set(`kyc:${userId}`, updated);
    // index key so admin can list all
    await kv.set(`kyc_index:${userId}`, userId);
    return c.json({ kyc: updated });
  } catch (e) {
    return c.json({ error: `${e}` }, 500);
  }
});

// POST /kyc/submit  — change status to submitted
app.post("/make-server-ca64c5bf/kyc/submit", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const existing: any = await kv.get(`kyc:${userId}`);
    if (!existing) return c.json({ error: "No KYC record found. Save details first." }, 400);
    if (existing.status === "approved") return c.json({ kyc: existing });
    const now = new Date().toISOString();
    const updated = { ...existing, status: "submitted", submittedAt: now, updatedAt: now };
    await kv.set(`kyc:${userId}`, updated);
    return c.json({ kyc: updated });
  } catch (e) {
    return c.json({ error: `${e}` }, 500);
  }
});

// GET /kyc/all  — admin: list all KYC records
app.get("/make-server-ca64c5bf/kyc/all", verifyAuth, async (c) => {
  try {
    const userRole = c.get("userRole");
    if (userRole !== "admin") return c.json({ error: "Admin only" }, 403);
    const indexEntries = await kv.getByPrefix("kyc_index:");
    const uids: string[] = indexEntries.map((e: any) => (typeof e === "string" ? e : e.value || e)).filter(Boolean);
    const records = await Promise.all(uids.map((uid: string) => kv.get(`kyc:${uid}`)));
    return c.json({ kycs: records.filter(Boolean) });
  } catch (e) {
    return c.json({ error: `${e}` }, 500);
  }
});

// GET /kyc/admin  — member: fetch the first admin's KYC record (full docs included)
app.get("/make-server-ca64c5bf/kyc/admin", verifyAuth, async (c) => {
  try {
    const indexEntries = await kv.getByPrefix("kyc_index:");
    const uids: string[] = indexEntries.map((e: any) => (typeof e === "string" ? e : e.value || e)).filter(Boolean);
    const records = await Promise.all(uids.map((uid: string) => kv.get(`kyc:${uid}`)));
    // Return admin KYC for any status that has documents (submitted, approved, or rejected)
    const adminRec = records.find((r: any) => r && r.userRole === "admin" && r.status !== "draft");
    if (!adminRec) return c.json({ kyc: null });
    return c.json({ kyc: adminRec });
  } catch (e) {
    return c.json({ error: `${e}` }, 500);
  }
});

// PATCH /kyc/:targetUserId/status  — admin: approve or reject
app.patch("/make-server-ca64c5bf/kyc/:targetUserId/status", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const userRole = await kv.get(`user:${userId}:role`);
    if (userRole !== "admin") return c.json({ error: "Admin only" }, 403);
    const targetUserId = c.req.param("targetUserId");
    const { status, reviewNote } = await c.req.json();
    if (!["approved", "rejected", "submitted"].includes(status)) return c.json({ error: "Invalid status" }, 400);
    const existing: any = await kv.get(`kyc:${targetUserId}`);
    if (!existing) return c.json({ error: "KYC record not found" }, 404);
    const now = new Date().toISOString();
    const updated = { ...existing, status, reviewNote: reviewNote || "", reviewedAt: now, updatedAt: now };
    await kv.set(`kyc:${targetUserId}`, updated);
    return c.json({ kyc: updated });
  } catch (e) {
    return c.json({ error: `${e}` }, 500);
  }
});

// ── AI Chatbot ────────────────────────────────────────────────────────────────
app.post("/make-server-ca64c5bf/chat", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { message, history, groupContext } = await c.req.json();

    if (!message?.trim()) return c.json({ error: "Message is required" }, 400);

    const apiKey = (Deno.env.get("ANTHROPIC_API_KEY") || "").trim();
    if (!apiKey) return c.json({ error: "AI not configured on server" }, 500);
    if (!apiKey.startsWith("sk-ant-")) {
      console.log("ANTHROPIC_API_KEY appears malformed (does not start with sk-ant-)");
      return c.json({ error: "AI service misconfigured – please re-enter the API key" }, 500);
    }

    const credentials = await kv.get(`user:${userId}:credentials`);
    const role = (await kv.get(`user:${userId}:role`)) || "member";
    const userName = credentials?.name || "User";

    const systemPrompt = `You are ChitBot 🤖, a friendly and knowledgeable AI assistant built into the Digital Chit Fund Manager app.

About the user:
- Name: ${userName}
- Role: ${role} (${role === "admin" ? "can create groups, add members, collect payments" : "can view their groups and make contributions"})
${groupContext ? `- Their chit groups summary: ${groupContext}` : "- No groups yet"}

Your purpose:
- Help users understand how chit funds work
- Answer questions about their groups, payments, contributions, and bids
- Guide them through app features (creating groups, making payments via UPI/Razorpay, entering UTR numbers, bidding)
- Explain chit fund concepts clearly in simple language

Rules:
- Keep responses concise — 2-3 sentences for simple questions, up to 5 for detailed ones
- Be warm, supportive, and use a conversational tone suitable for Indian users
- If the user writes in Hindi, Tamil, Telugu, Kannada, Malayalam, Gujarati, or any Indian language, respond in that same language
- Format numbers in Indian style (₹1,00,000 not $100,000)
- Never make up specific data about their account — refer to what's provided above or tell them to check the app section
- If unsure, say so honestly and guide them to the right page in the app`;

    // Build messages array with conversation history
    const messages: { role: "user" | "assistant"; content: string }[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-8)) { // last 8 exchanges for context
        if (h.role === "user" || h.role === "assistant") {
          messages.push({ role: h.role, content: h.content });
        }
      }
    }
    messages.push({ role: "user", content: message.trim() });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.log(`Anthropic API error (HTTP ${res.status}):`, JSON.stringify(data));
      const msg = data.error?.message || "AI service error";
      return c.json({ error: msg }, 500);
    }

    const reply = data.content?.[0]?.text || "Sorry, I couldn't generate a response. Please try again.";
    return c.json({ reply });
  } catch (e) {
    console.log("Chat exception:", e);
    return c.json({ error: `Chat failed: ${e}` }, 500);
  }
});

Deno.serve(app.fetch);