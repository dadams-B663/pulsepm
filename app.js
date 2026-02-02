// ============================================
// SUPABASE INITIALIZATION
// ============================================
console.log('PulsePM: app.js loaded');
console.log('PulsePM: Supabase URL:', SUPABASE_URL);

let db;
try {
  // The UMD build exports supabase with createClient
  const supabaseLib = window.supabase;
  console.log('PulsePM: Supabase library:', supabaseLib);
  
  if (!supabaseLib || !supabaseLib.createClient) {
    throw new Error('Supabase library not loaded. Please refresh the page.');
  }
  
  db = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('PulsePM: Supabase client created successfully');
} catch (err) {
  console.error('PulsePM: Failed to create Supabase client:', err);
  alert('Failed to connect to database: ' + err.message);
}

// App state
let currentUser = null;
let currentProfile = null;
let state = {
  tasks: [],
  todos: [],
  files: [],
  aiSuggestions: [],
};
let profiles = [];
let invites = [];
let currentSlide = 0;

const priorityRank = { Critical: 1, High: 2, Medium: 3, Low: 4 };

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
  authModal: document.getElementById("auth-modal"),
  loginForm: document.getElementById("login-form"),
  registerForm: document.getElementById("register-form"),
  authModalTitle: document.getElementById("auth-modal-title"),
  authModalSubtitle: document.getElementById("auth-modal-subtitle"),
  showRegister: document.getElementById("show-register"),
  showLogin: document.getElementById("show-login"),
  loginEmail: document.getElementById("login-email"),
  loginPassword: document.getElementById("login-password"),
  registerName: document.getElementById("register-name"),
  registerEmail: document.getElementById("register-email"),
  registerPassword: document.getElementById("register-password"),
  registerRole: document.getElementById("register-role"),
  registerDepartment: document.getElementById("register-department"),
  registerInvite: document.getElementById("register-invite"),
  userAvatar: document.getElementById("user-avatar"),
  userName: document.getElementById("user-name"),
  userRole: document.getElementById("user-role"),
  logoutBtn: document.getElementById("logout-btn"),
  inviteModal: document.getElementById("invite-modal"),
  inviteForm: document.getElementById("invite-form"),
  inviteRole: document.getElementById("invite-role"),
  invitePermAdmin: document.getElementById("invite-perm-admin"),
  invitePermEdit: document.getElementById("invite-perm-edit"),
  invitePermSee: document.getElementById("invite-perm-see"),
  invitePermShare: document.getElementById("invite-perm-share"),
  inviteResult: document.getElementById("invite-result"),
  generatedInviteCode: document.getElementById("generated-invite-code"),
  copyInviteCode: document.getElementById("copy-invite-code"),
  closeInviteModal: document.getElementById("close-invite-modal"),
  doneInvite: document.getElementById("done-invite"),
  inviteUserBtn: document.getElementById("invite-user-btn"),
  inviteList: document.getElementById("invite-list"),
  memberList: document.getElementById("member-list"),
  memberCount: document.getElementById("member-count"),
  navLinks: document.querySelectorAll(".nav-link"),
  panels: document.querySelectorAll(".panel"),
  taskForm: document.getElementById("task-form"),
  taskTitle: document.getElementById("task-title"),
  taskPriority: document.getElementById("task-priority"),
  taskStatus: document.getElementById("task-status"),
  taskAssignee: document.getElementById("task-assignee"),
  taskTeam: document.getElementById("task-team"),
  taskDue: document.getElementById("task-due"),
  taskNotes: document.getElementById("task-notes"),
  taskTable: document.getElementById("task-table"),
  taskFilter: document.getElementById("task-filter"),
  taskSort: document.getElementById("task-sort"),
  todoForm: document.getElementById("todo-form"),
  todoTitle: document.getElementById("todo-title"),
  todoAssign: document.getElementById("todo-assign"),
  todoStatus: document.getElementById("todo-status"),
  todoProgress: document.getElementById("todo-progress"),
  todoLocked: document.getElementById("todo-locked"),
  addTodoBtn: document.getElementById("add-todo-btn"),
  todoCancel: document.getElementById("todo-cancel"),
  unassignedTodos: document.getElementById("unassigned-todos"),
  userTodosGrid: document.getElementById("user-todos-grid"),
  fileForm: document.getElementById("file-form"),
  fileUpload: document.getElementById("file-upload"),
  fileLink: document.getElementById("file-link"),
  fileNotes: document.getElementById("file-notes"),
  fileList: document.getElementById("file-list"),
  addFileBtn: document.getElementById("add-file-btn"),
  fileCancel: document.getElementById("file-cancel"),
  filePreviewModal: document.getElementById("file-preview-modal"),
  previewFileName: document.getElementById("preview-file-name"),
  previewFileType: document.getElementById("preview-file-type"),
  previewContent: document.getElementById("preview-content"),
  closePreview: document.getElementById("close-preview"),
  downloadFile: document.getElementById("download-file"),
  aiInput: document.getElementById("ai-input"),
  aiResults: document.getElementById("ai-results"),
  aiTarget: document.getElementById("ai-target"),
  aiExtract: document.getElementById("ai-extract"),
  aiImport: document.getElementById("ai-import"),
  exampleSlides: document.getElementById("example-slides"),
  metricTasks: document.getElementById("metric-tasks"),
  metricProgress: document.getElementById("metric-progress"),
  metricFiles: document.getElementById("metric-files"),
  priorityList: document.getElementById("priority-list"),
  activityList: document.getElementById("activity-list"),
  seedDemo: document.getElementById("seed-demo"),
};

// ============================================
// SUPABASE DATA FUNCTIONS
// ============================================
async function loadAllData() {
  try {
    // Load tasks
    const { data: tasks, error: tasksError } = await db
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (tasksError) throw tasksError;
    state.tasks = tasks || [];

    // Load todos
    const { data: todos, error: todosError } = await db
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (todosError) throw todosError;
    state.todos = todos || [];

    // Load files
    const { data: files, error: filesError } = await db
      .from('files')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filesError) throw filesError;
    state.files = files || [];

    // Load profiles
    const { data: profilesData, error: profilesError } = await db
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (profilesError) throw profilesError;
    profiles = profilesData || [];

    // Load invites
    const { data: invitesData, error: invitesError } = await db
      .from('invites')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (invitesError) throw invitesError;
    invites = invitesData || [];

    renderAll();
  } catch (error) {
    console.error('Error loading data:', error);
    showNotification('Failed to load data. Please refresh.', 'error');
  }
}

// ============================================
// AUTH FUNCTIONS
// ============================================
function showAuthModal() {
  elements.authModal.classList.remove("hidden");
}

function hideAuthModal() {
  elements.authModal.classList.add("hidden");
}

function showLoginForm() {
  elements.loginForm.classList.remove("hidden");
  elements.registerForm.classList.add("hidden");
  elements.authModalTitle.textContent = "Sign In";
  elements.authModalSubtitle.textContent = "Welcome back to PulsePM";
}

function showRegisterForm() {
  elements.loginForm.classList.add("hidden");
  elements.registerForm.classList.remove("hidden");
  elements.authModalTitle.textContent = "Create Account";
  elements.authModalSubtitle.textContent = "Join your team on PulsePM";
}

function updateUserUI() {
  if (currentProfile) {
    elements.userAvatar.textContent = currentProfile.name.charAt(0).toUpperCase();
    elements.userName.textContent = currentProfile.name;
    elements.userRole.textContent = `${currentProfile.role} • ${currentProfile.department}`;
    
    const inviteUserCard = document.getElementById("invite-user-card");
    if (inviteUserCard) {
      if (currentProfile.permissions?.admin) {
        inviteUserCard.classList.remove("hidden");
      } else {
        inviteUserCard.classList.add("hidden");
      }
    }
  }
}

// Auth switch handlers
elements.showRegister.addEventListener("click", (e) => {
  e.preventDefault();
  console.log('PulsePM: Show register clicked');
  showRegisterForm();
});

elements.showLogin.addEventListener("click", (e) => {
  e.preventDefault();
  console.log('PulsePM: Show login clicked');
  showLoginForm();
});

// Debug: Add click listeners to buttons
document.addEventListener('DOMContentLoaded', () => {
  console.log('PulsePM: DOM fully loaded');
  
  const loginBtn = document.querySelector('#login-form button[type="submit"]');
  const registerBtn = document.querySelector('#register-form button[type="submit"]');
  
  if (loginBtn) {
    console.log('PulsePM: Login button found');
    loginBtn.addEventListener('click', () => console.log('PulsePM: Login button clicked'));
  } else {
    console.error('PulsePM: Login button NOT found');
  }
  
  if (registerBtn) {
    console.log('PulsePM: Register button found');
    registerBtn.addEventListener('click', () => console.log('PulsePM: Register button clicked'));
  } else {
    console.error('PulsePM: Register button NOT found');
  }
});

// Login handler
elements.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log('PulsePM: Login form submitted');
  
  const email = elements.loginEmail.value.trim().toLowerCase();
  const password = elements.loginPassword.value;
  
  const submitBtn = elements.loginForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Signing in...';
  submitBtn.disabled = true;

  try {
    console.log('PulsePM: Attempting login for:', email);
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('PulsePM: Auth error:', error);
      throw error;
    }

    console.log('PulsePM: Login successful, loading profile...');
    currentUser = data.user;
    
    // Load user profile
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('PulsePM: Profile error:', profileError);
      throw profileError;
    }
    
    currentProfile = profile;
    
    hideAuthModal();
    updateUserUI();
    setActiveSection("dashboard");
    await loadAllData();
    elements.loginForm.reset();
    
    showSplashScreen(profile.name);
  } catch (error) {
    console.error('Login error:', error);
    alert(error.message || "Invalid email or password.");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// Register handler
elements.registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log('PulsePM: Register form submitted');
  
  const name = elements.registerName.value.trim();
  const email = elements.registerEmail.value.trim().toLowerCase();
  const password = elements.registerPassword.value;
  const role = elements.registerRole.value;
  const department = elements.registerDepartment.value;
  const inviteCode = elements.registerInvite.value.trim().toUpperCase();

  if (!name || !email || !password || !role) {
    alert('Please fill in all required fields.');
    return;
  }

  const submitBtn = elements.registerForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Creating account...';
  submitBtn.disabled = true;

  let permissions = { admin: false, edit: true, see: true, share: false };

  try {
    // Check invite code if provided
    if (inviteCode) {
      console.log('PulsePM: Checking invite code:', inviteCode);
      const { data: invite, error: inviteError } = await db
        .from('invites')
        .select('*')
        .eq('code', inviteCode)
        .eq('used', false)
        .single();

      if (inviteError || !invite) {
        alert("Invalid or already used invite code.");
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }
      
      permissions = invite.permissions;
      
      // Mark invite as used
      await db
        .from('invites')
        .update({ 
          used: true, 
          used_by: email,
          used_at: new Date().toISOString()
        })
        .eq('id', invite.id);
    }

    // Create auth user
    console.log('PulsePM: Creating auth user for:', email);
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name,
          role,
          department,
        }
      }
    });

    if (error) {
      console.error('PulsePM: SignUp error:', error);
      throw error;
    }

    console.log('PulsePM: Auth user created:', data);

    // Check if email confirmation is required
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      alert('An account with this email already exists. Please sign in instead.');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      return;
    }

    // Check if user needs to confirm email
    if (data.user && !data.session) {
      alert('Please check your email to confirm your account, then sign in.');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      showLoginForm();
      return;
    }

    // Create profile
    console.log('PulsePM: Creating profile...');
    const { error: profileError } = await db
      .from('profiles')
      .insert({
        id: data.user.id,
        name,
        email,
        role,
        department,
        permissions,
      });

    if (profileError) {
      console.error('PulsePM: Profile creation error:', profileError);
      throw profileError;
    }

    console.log('PulsePM: Profile created successfully!');
    currentUser = data.user;
    currentProfile = {
      id: data.user.id,
      name,
      email,
      role,
      department,
      permissions,
    };
    
    hideAuthModal();
    updateUserUI();
    setActiveSection("dashboard");
    await loadAllData();
    elements.registerForm.reset();
    
    showSplashScreen(name);
  } catch (error) {
    console.error('Registration error:', error);
    alert(error.message || "Registration failed. Please try again.");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// Logout handler
elements.logoutBtn.addEventListener("click", async () => {
  await db.auth.signOut();
  currentUser = null;
  currentProfile = null;
  state = { tasks: [], todos: [], files: [], aiSuggestions: [] };
  profiles = [];
  invites = [];
  showAuthModal();
  showLoginForm();
});

// ============================================
// PERMISSION HELPERS
// ============================================
function canEdit() {
  return currentProfile?.permissions?.edit || currentProfile?.permissions?.admin;
}

function isAdmin() {
  return currentProfile?.permissions?.admin;
}

// ============================================
// NAVIGATION
// ============================================
function setActiveSection(sectionId) {
  elements.panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === sectionId);
  });
  elements.navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.section === sectionId);
  });
}

elements.navLinks.forEach((link) => {
  link.addEventListener("click", () => setActiveSection(link.dataset.section));
});

document.querySelectorAll("[data-section]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.section;
    if (target) {
      setActiveSection(target);
      
      setTimeout(() => {
        if (target === "tasks") {
          populateTaskAssigneeDropdown();
          elements.taskTitle.focus();
          elements.taskTitle.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (target === "todos") {
          elements.todoForm.classList.remove("hidden");
          populateTodoAssignDropdown();
          elements.todoTitle.focus();
          elements.todoForm.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (target === "files") {
          elements.fileForm.classList.remove("hidden");
          elements.fileForm.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (target === "ai") {
          elements.aiInput.focus();
          elements.aiInput.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  });
});

// ============================================
// INVITE SYSTEM
// ============================================
let currentInviteData = null;

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

elements.inviteUserBtn.addEventListener("click", () => {
  if (!isAdmin()) return;
  elements.inviteModal.classList.remove("hidden");
  elements.inviteForm.classList.remove("hidden");
  elements.inviteResult.classList.add("hidden");
});

elements.closeInviteModal.addEventListener("click", () => {
  elements.inviteModal.classList.add("hidden");
  elements.inviteForm.reset();
  elements.inviteForm.classList.remove("hidden");
  elements.inviteResult.classList.add("hidden");
  currentInviteData = null;
});

elements.doneInvite.addEventListener("click", () => {
  elements.inviteModal.classList.add("hidden");
  elements.inviteForm.reset();
  elements.inviteForm.classList.remove("hidden");
  elements.inviteResult.classList.add("hidden");
  currentInviteData = null;
  renderInvites();
});

elements.inviteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const recipientEmail = document.getElementById("invite-email").value.trim();
  const recipientName = document.getElementById("invite-recipient-name").value.trim() || "Team Member";
  const code = generateInviteCode();
  
  const invite = {
    code,
    email: recipientEmail,
    role: elements.inviteRole.value,
    permissions: {
      admin: elements.invitePermAdmin.checked,
      edit: elements.invitePermEdit.checked,
      see: elements.invitePermSee.checked,
      share: elements.invitePermShare.checked,
    },
    used: false,
  };

  try {
    console.log('PulsePM: Creating invite with data:', invite);
    const { data, error } = await db.from('invites').insert(invite).select();
    if (error) {
      console.error('PulsePM: Invite insert error details:', error);
      throw error;
    }
    console.log('PulsePM: Invite created:', data);
    
    invites.push(data[0] || invite);

    const baseUrl = window.location.href.split('?')[0].split('#')[0];
    const inviteLink = `${baseUrl}?invite=${code}`;
    
    currentInviteData = {
      code,
      email: recipientEmail,
      name: recipientName,
      role: invite.role,
      link: inviteLink,
      inviterName: currentProfile.name
    };

    elements.generatedInviteCode.textContent = code;
    document.getElementById("generated-invite-link").textContent = inviteLink;
    document.getElementById("invite-sent-to").textContent = recipientEmail;
    
    elements.inviteForm.classList.add("hidden");
    elements.inviteResult.classList.remove("hidden");
  } catch (error) {
    console.error('Error creating invite:', error);
    alert('Failed to create invite: ' + (error.message || error.details || 'Unknown error'));
  }
});

document.getElementById("send-email-btn").addEventListener("click", () => {
  if (!currentInviteData) return;
  
  const subject = encodeURIComponent(`You're invited to join PulsePM - ${currentInviteData.inviterName}`);
  const body = encodeURIComponent(
`Hi ${currentInviteData.name},

${currentInviteData.inviterName} has invited you to join PulsePM as a ${currentInviteData.role}.

Click the link below to create your account:
${currentInviteData.link}

Or use this invite code when registering:
${currentInviteData.code}

This invite code can only be used once.

Best regards,
The PulsePM Team`
  );
  
  window.open(`mailto:${currentInviteData.email}?subject=${subject}&body=${body}`, '_blank');
});

document.getElementById("copy-invite-link").addEventListener("click", () => {
  if (!currentInviteData) return;
  navigator.clipboard.writeText(currentInviteData.link);
  const btn = document.getElementById("copy-invite-link");
  btn.textContent = "✓ Copied!";
  setTimeout(() => {
    btn.textContent = "📋 Copy Link";
  }, 2000);
});

elements.copyInviteCode.addEventListener("click", () => {
  navigator.clipboard.writeText(elements.generatedInviteCode.textContent);
  elements.copyInviteCode.textContent = "✓ Copied!";
  setTimeout(() => {
    elements.copyInviteCode.textContent = "📝 Copy Code";
  }, 2000);
});

// ============================================
// TASKS
// ============================================
function populateTaskAssigneeDropdown() {
  const options = ['<option value="">Unassigned</option>'];
  profiles.forEach((profile) => {
    options.push(`<option value="${profile.id}">${escapeHtml(profile.name)}</option>`);
  });
  elements.taskAssignee.innerHTML = options.join("");
}

elements.taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!canEdit()) return alert("You don't have permission to create tasks.");
  
  const taskDueHidden = document.getElementById("task-due-hidden");
  const assigneeId = elements.taskAssignee.value || null;
  const assigneeProfile = assigneeId ? profiles.find(p => p.id === assigneeId) : null;
  
  // Only include fields that exist in the Supabase tasks table
  const task = {
    title: elements.taskTitle.value.trim(),
    status: elements.taskStatus.value,
  };
  
  if (!task.title) return;

  try {
    console.log('PulsePM: Creating task:', task);
    
    // Insert task
    const { data: newTask, error: taskError } = await db
      .from('tasks')
      .insert(task)
      .select()
      .single();
    
    if (taskError) {
      console.error('PulsePM: Task insert error:', taskError);
      throw taskError;
    }
    
    console.log('PulsePM: Task created:', newTask);
    
    // Also create a corresponding todo (minimal fields only)
    const todo = {
      text: task.title,
    };
    
    console.log('PulsePM: Creating linked todo:', todo);
    const { error: todoError } = await db.from('todos').insert(todo);
    if (todoError) {
      console.error('PulsePM: Todo insert error:', todoError);
      // Don't throw - task was created successfully
    }
    
    elements.taskForm.reset();
    if (taskDueHidden) taskDueHidden.value = "";
    populateTaskAssigneeDropdown();
    
    await loadAllData();
    console.log('PulsePM: Task creation complete!');
  } catch (error) {
    console.error('Error creating task:', error);
    alert('Failed to create task: ' + (error.message || 'Unknown error'));
  }
});

document.getElementById("task-clear").addEventListener("click", () => {
  elements.taskForm.reset();
});

elements.taskFilter.addEventListener("change", renderTasks);
elements.taskSort.addEventListener("change", renderTasks);

// ============================================
// TODOS
// ============================================
elements.addTodoBtn.addEventListener("click", () => {
  elements.todoForm.classList.toggle("hidden");
  populateTodoAssignDropdown();
});

elements.todoCancel.addEventListener("click", () => {
  elements.todoForm.classList.add("hidden");
  elements.todoForm.reset();
});

function populateTodoAssignDropdown() {
  const options = ['<option value="">Unassigned (anyone can claim)</option>'];
  profiles.forEach((profile) => {
    options.push(`<option value="${profile.id}">${escapeHtml(profile.name)}</option>`);
  });
  elements.todoAssign.innerHTML = options.join("");
}

elements.todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!canEdit()) return alert("You don't have permission to create todos.");
  
  // Only include fields that exist in the Supabase todos table
  const todo = {
    text: elements.todoTitle.value.trim(),
  };
  
  if (!todo.text) return;

  try {
    console.log('PulsePM: Creating todo:', todo);
    const { data, error } = await db.from('todos').insert(todo).select();
    if (error) {
      console.error('PulsePM: Todo insert error:', error);
      throw error;
    }
    console.log('PulsePM: Todo created:', data);
    
    elements.todoForm.classList.add("hidden");
    elements.todoForm.reset();
    await loadAllData();
  } catch (error) {
    console.error('Error creating todo:', error);
    alert('Failed to create todo: ' + (error.message || 'Unknown error'));
  }
});

async function claimTodo(todoId) {
  const todo = state.todos.find((t) => t.id === todoId);
  if (todo) {
    try {
      // Just update the status to "In progress" when claiming
      await db
        .from('todos')
        .update({ status: 'In progress', progress: 25 })
        .eq('id', todoId);
      
      await loadAllData();
    } catch (error) {
      console.error('Error claiming todo:', error);
    }
  }
}

async function updateTodoProgress(todoId, progress) {
  try {
    await db
      .from('todos')
      .update({ progress })
      .eq('id', todoId);
    
    await loadAllData();
  } catch (error) {
    console.error('Error updating progress:', error);
  }
}

async function updateTodoStatus(todoId, status) {
  try {
    const updates = { status };
    if (status === "Done") updates.progress = 100;
    
    await db
      .from('todos')
      .update(updates)
      .eq('id', todoId);
    
    await loadAllData();
  } catch (error) {
    console.error('Error updating status:', error);
  }
}

// ============================================
// EDIT & DELETE TODOS
// ============================================
const editTodoModal = document.getElementById("edit-todo-modal");
const editTodoForm = document.getElementById("edit-todo-form");
const editTodoId = document.getElementById("edit-todo-id");
const editTodoTitle = document.getElementById("edit-todo-title");
const editTodoAssign = document.getElementById("edit-todo-assign");
const editTodoPriority = document.getElementById("edit-todo-priority");
const editTodoStatus = document.getElementById("edit-todo-status");
const editTodoDue = document.getElementById("edit-todo-due");
const editTodoDueHidden = document.getElementById("edit-todo-due-hidden");
const editTodoLocked = document.getElementById("edit-todo-locked");
const cancelEditTodo = document.getElementById("cancel-edit-todo");

const deleteConfirmModal = document.getElementById("delete-confirm-modal");
const deleteItemPreview = document.getElementById("delete-item-preview");
const confirmDeleteBtn = document.getElementById("confirm-delete");
const cancelDeleteBtn = document.getElementById("cancel-delete");

let todoToDelete = null;

function populateEditAssignDropdown() {
  const options = ['<option value="">Unassigned</option>'];
  profiles.forEach((profile) => {
    options.push(`<option value="${profile.id}">${escapeHtml(profile.name)}</option>`);
  });
  editTodoAssign.innerHTML = options.join("");
}

function openEditTodoModal(todoId) {
  const todo = state.todos.find((t) => t.id === todoId);
  if (!todo) return;
  
  populateEditAssignDropdown();
  
  editTodoId.value = todo.id;
  editTodoTitle.value = todo.text;
  editTodoAssign.value = todo.assignee_id || "";
  editTodoPriority.value = todo.priority || "";
  editTodoStatus.value = todo.status;
  editTodoLocked.checked = todo.locked || false;
  
  if (todo.due_date) {
    editTodoDueHidden.value = todo.due_date;
    const date = new Date(todo.due_date);
    editTodoDue.value = formatDateForDisplay(date);
  } else {
    editTodoDueHidden.value = "";
    editTodoDue.value = "";
  }
  
  editTodoModal.classList.remove("hidden");
}

function closeEditTodoModal() {
  editTodoModal.classList.add("hidden");
  editTodoForm.reset();
}

cancelEditTodo.addEventListener("click", closeEditTodoModal);

editTodoModal.addEventListener("click", (e) => {
  if (e.target === editTodoModal) closeEditTodoModal();
});

editTodoDue.addEventListener("click", () => {
  openCalendar(editTodoDue, editTodoDueHidden);
});

editTodoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const todoId = editTodoId.value;
  const todo = state.todos.find((t) => t.id === todoId);
  if (!todo) return;
  
  const updates = {
    text: editTodoTitle.value.trim(),
    status: editTodoStatus.value,
  };
  
  if (updates.status === "Done") {
    updates.progress = 100;
  }

  try {
    console.log('PulsePM: Updating todo:', todoId, updates);
    const { error } = await db
      .from('todos')
      .update(updates)
      .eq('id', todoId);
    
    if (error) {
      console.error('PulsePM: Todo update error:', error);
      throw error;
    }
    
    closeEditTodoModal();
    await loadAllData();
  } catch (error) {
    console.error('Error updating todo:', error);
    alert('Failed to update: ' + (error.message || 'Unknown error'));
  }
});

function openDeleteConfirmModal(todoId) {
  const todo = state.todos.find((t) => t.id === todoId);
  if (!todo) return;
  
  todoToDelete = todoId;
  deleteItemPreview.innerHTML = `<div class="delete-item-title">${escapeHtml(todo.text)}</div>`;
  deleteConfirmModal.classList.remove("hidden");
}

function closeDeleteConfirmModal() {
  deleteConfirmModal.classList.add("hidden");
  todoToDelete = null;
}

cancelDeleteBtn.addEventListener("click", closeDeleteConfirmModal);

deleteConfirmModal.addEventListener("click", (e) => {
  if (e.target === deleteConfirmModal) closeDeleteConfirmModal();
});

confirmDeleteBtn.addEventListener("click", async () => {
  if (!todoToDelete) return;

  try {
    // Delete todo
    await db.from('todos').delete().eq('id', todoToDelete);
    
    closeDeleteConfirmModal();
    await loadAllData();
  } catch (error) {
    console.error('Error deleting:', error);
    alert('Failed to delete: ' + (error.message || 'Unknown error'));
  }
});

// ============================================
// EDIT PERMISSIONS MODAL
// ============================================
const editPermissionsModal = document.getElementById("edit-permissions-modal");
const editPermissionsForm = document.getElementById("edit-permissions-form");
const editPermUserId = document.getElementById("edit-perm-user-id");
const editPermUserName = document.getElementById("edit-perm-user-name");
const editPermRole = document.getElementById("edit-perm-role");
const editPermAdmin = document.getElementById("edit-perm-admin");
const editPermEdit = document.getElementById("edit-perm-edit");
const editPermSee = document.getElementById("edit-perm-see");
const editPermShare = document.getElementById("edit-perm-share");
const cancelEditPerm = document.getElementById("cancel-edit-perm");

function openEditPermissionsModal(userId) {
  const profile = profiles.find(p => p.id === userId);
  if (!profile) return;
  
  editPermUserId.value = profile.id;
  editPermUserName.textContent = profile.name;
  editPermRole.value = profile.role;
  editPermAdmin.checked = profile.permissions?.admin || false;
  editPermEdit.checked = profile.permissions?.edit || false;
  editPermSee.checked = profile.permissions?.see || false;
  editPermShare.checked = profile.permissions?.share || false;
  
  editPermissionsModal.classList.remove("hidden");
}

function closeEditPermissionsModal() {
  editPermissionsModal.classList.add("hidden");
  editPermissionsForm.reset();
}

cancelEditPerm.addEventListener("click", closeEditPermissionsModal);

editPermissionsModal.addEventListener("click", (e) => {
  if (e.target === editPermissionsModal) closeEditPermissionsModal();
});

editPermissionsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const userId = editPermUserId.value;
  
  const updates = {
    role: editPermRole.value,
    permissions: {
      admin: editPermAdmin.checked,
      edit: editPermEdit.checked,
      see: editPermSee.checked,
      share: editPermShare.checked,
    }
  };

  try {
    await db
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    closeEditPermissionsModal();
    await loadAllData();
    
    // Show success feedback
    alert('Permissions updated successfully!');
  } catch (error) {
    console.error('Error updating permissions:', error);
    alert('Failed to update permissions. Please try again.');
  }
});

// ============================================
// FILES
// ============================================
let currentPreviewFile = null;

elements.addFileBtn.addEventListener("click", () => {
  elements.fileForm.classList.toggle("hidden");
});

elements.fileCancel.addEventListener("click", () => {
  elements.fileForm.classList.add("hidden");
  elements.fileForm.reset();
});

elements.fileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!canEdit()) return alert("You don't have permission to add files.");
  
  const files = Array.from(elements.fileUpload.files || []);
  const link = elements.fileLink.value.trim();
  const notes = elements.fileNotes.value.trim();

  try {
    // Process uploaded files (minimal fields only)
    for (const file of files) {
      const fileRecord = {
        name: file.name,
      };
      
      console.log('PulsePM: Uploading file:', fileRecord);
      const { data, error } = await db.from('files').insert(fileRecord).select();
      if (error) {
        console.error('PulsePM: File insert error:', error);
        alert('Failed to upload file: ' + (error.message || 'Unknown error'));
      } else {
        console.log('PulsePM: File uploaded:', data);
        await loadAllData();
      }
    }

    // Process link (minimal fields only)
    if (link) {
      const fileRecord = {
        name: link.split("/").pop() || "Shared Link",
      };
      
      console.log('PulsePM: Adding link:', fileRecord);
      const { data, error } = await db.from('files').insert(fileRecord).select();
      if (error) {
        console.error('PulsePM: Link insert error:', error);
        alert('Failed to add link: ' + (error.message || 'Unknown error'));
      } else {
        console.log('PulsePM: Link added:', data);
        await loadAllData();
      }
    }

    elements.fileForm.classList.add("hidden");
    elements.fileForm.reset();
  } catch (error) {
    console.error('Error uploading file:', error);
    alert('Failed to upload: ' + (error.message || 'Unknown error'));
  }
});

// File filter event listeners
document.getElementById('file-search')?.addEventListener('input', renderFiles);
document.getElementById('file-type-filter')?.addEventListener('change', renderFiles);

// Edit File Modal
let currentEditFileId = null;

function openEditFileModal(fileId) {
  const file = state.files.find(f => f.id === fileId);
  if (!file) return;
  
  currentEditFileId = fileId;
  document.getElementById('edit-file-id').value = fileId;
  document.getElementById('edit-file-name').value = file.name || '';
  document.getElementById('edit-file-link').value = file.link || '';
  document.getElementById('edit-file-modal').classList.remove('hidden');
}

function closeEditFileModal() {
  document.getElementById('edit-file-modal').classList.add('hidden');
  currentEditFileId = null;
}

document.getElementById('cancel-edit-file')?.addEventListener('click', closeEditFileModal);
document.getElementById('edit-file-modal')?.addEventListener('click', (e) => {
  if (e.target.id === 'edit-file-modal') closeEditFileModal();
});

document.getElementById('edit-file-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!canEdit() || !currentEditFileId) return;
  
  const newName = document.getElementById('edit-file-name').value.trim();
  if (!newName) return alert('File name is required');
  
  try {
    const { error } = await db.from('files').update({ name: newName }).eq('id', currentEditFileId);
    if (error) throw error;
    
    closeEditFileModal();
    await loadAllData();
    showNotification('File updated successfully', 'success');
  } catch (error) {
    console.error('Error updating file:', error);
    alert('Failed to update file: ' + (error.message || 'Unknown error'));
  }
});

// Delete File Modal
let currentDeleteFileId = null;

function openDeleteFileModal(fileId) {
  const file = state.files.find(f => f.id === fileId);
  if (!file) return;
  
  currentDeleteFileId = fileId;
  document.getElementById('delete-file-preview').innerHTML = `<strong>${escapeHtml(file.name || 'Unknown File')}</strong>`;
  document.getElementById('delete-file-modal').classList.remove('hidden');
}

function closeDeleteFileModal() {
  document.getElementById('delete-file-modal').classList.add('hidden');
  currentDeleteFileId = null;
}

document.getElementById('cancel-delete-file')?.addEventListener('click', closeDeleteFileModal);
document.getElementById('delete-file-modal')?.addEventListener('click', (e) => {
  if (e.target.id === 'delete-file-modal') closeDeleteFileModal();
});

document.getElementById('confirm-delete-file')?.addEventListener('click', async () => {
  if (!canEdit() || !currentDeleteFileId) return;
  
  try {
    const { error } = await db.from('files').delete().eq('id', currentDeleteFileId);
    if (error) throw error;
    
    closeDeleteFileModal();
    await loadAllData();
    showNotification('File deleted successfully', 'success');
  } catch (error) {
    console.error('Error deleting file:', error);
    alert('Failed to delete file: ' + (error.message || 'Unknown error'));
  }
});

function getFileIcon(type, name) {
  const ext = name.split(".").pop().toLowerCase();
  if (type.includes("image") || ["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return { icon: "🖼️", class: "image" };
  if (type.includes("pdf") || ext === "pdf") return { icon: "📕", class: "pdf" };
  if (type.includes("word") || ["doc", "docx"].includes(ext)) return { icon: "📘", class: "doc" };
  if (type.includes("sheet") || type.includes("excel") || ["xls", "xlsx", "csv"].includes(ext)) return { icon: "📗", class: "sheet" };
  if (type.includes("presentation") || ["ppt", "pptx"].includes(ext)) return { icon: "📙", class: "slide" };
  if (type === "link") return { icon: "🔗", class: "link" };
  return { icon: "📄", class: "" };
}

function previewFile(fileId) {
  const file = state.files.find((f) => f.id === fileId);
  if (!file) return;
  
  currentPreviewFile = file;
  elements.previewFileName.textContent = file.name;
  elements.previewFileType.textContent = file.type === "link" ? "External Link" : file.type;
  
  const isImage = file.type.includes("image") || ["png", "jpg", "jpeg", "gif", "webp"].some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (file.link) {
    elements.previewContent.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="font-size: 64px; margin-bottom: 20px;">🔗</div>
        <p style="color: var(--gray-400);">External link - click below to open</p>
        <a href="${file.link}" target="_blank" rel="noreferrer" class="primary" style="display: inline-block; margin-top: 16px; text-decoration: none;">Open Link</a>
      </div>
    `;
    elements.downloadFile.style.display = "none";
  } else if (isImage && file.data_url) {
    elements.previewContent.innerHTML = `<img src="${file.data_url}" alt="${escapeHtml(file.name)}" />`;
    elements.downloadFile.href = file.data_url;
    elements.downloadFile.download = file.name;
    elements.downloadFile.style.display = "inline-flex";
  } else if (file.data_url) {
    const icon = getFileIcon(file.type, file.name);
    elements.previewContent.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="font-size: 80px; margin-bottom: 20px;">${icon.icon}</div>
        <p style="color: var(--white); font-size: 18px; margin-bottom: 8px;">${escapeHtml(file.name)}</p>
        <p style="color: var(--gray-500);">${formatFileSize(file.size)}</p>
        ${file.notes ? `<p style="color: var(--gray-400); margin-top: 16px;">${escapeHtml(file.notes)}</p>` : ""}
      </div>
    `;
    elements.downloadFile.href = file.data_url;
    elements.downloadFile.download = file.name;
    elements.downloadFile.style.display = "inline-flex";
  }
  
  elements.filePreviewModal.classList.remove("hidden");
}

elements.closePreview.addEventListener("click", () => {
  elements.filePreviewModal.classList.add("hidden");
  currentPreviewFile = null;
});

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// ============================================
// AI CAPTURE
// ============================================
elements.aiExtract.addEventListener("click", () => {
  const text = elements.aiInput.value;
  state.aiSuggestions = extractImportantItems(text);
  renderAiResults();
});

document.getElementById("ai-clear").addEventListener("click", () => {
  elements.aiInput.value = "";
  state.aiSuggestions = [];
  renderAiResults();
});

elements.aiImport.addEventListener("click", async () => {
  if (!canEdit()) return alert("You don't have permission to import items.");
  
  const selected = state.aiSuggestions.filter((item) => item.selected);
  if (!selected.length) return alert("Please select at least one item to import.");
  
  const target = elements.aiTarget.value;
  let importedCount = 0;
  
  try {
    // Import to Tasks (if target is "tasks" or "both")
    if (target === "tasks" || target === "both") {
      // Filter out links for tasks (only import actionable items)
      const taskItems = selected.filter(item => item.type !== 'link');
      if (taskItems.length > 0) {
        const tasks = taskItems.map((item) => ({
          title: item.text.substring(0, 200), // Limit title length
        }));
        
        console.log('PulsePM: Importing tasks:', tasks);
        const { error } = await db.from('tasks').insert(tasks);
        if (error) {
          console.error('PulsePM: Task import error:', error);
          throw error;
        }
        importedCount += taskItems.length;
      }
    }
    
    // Import to Todos (if target is "todos" or "both")
    if (target === "todos" || target === "both") {
      const todos = selected.map((item) => ({
        text: item.text.substring(0, 200), // Limit text length
      }));
      
      console.log('PulsePM: Importing todos:', todos);
      const { error } = await db.from('todos').insert(todos);
      if (error) {
        console.error('PulsePM: Todo import error:', error);
        throw error;
      }
      if (target === "todos") importedCount += todos.length;
    }
    
    // Import links to Files (always import links)
    const linkItems = selected.filter(item => item.type === 'link');
    if (linkItems.length > 0) {
      const files = linkItems.map((item) => ({
        name: item.text.substring(0, 100),
      }));
      
      console.log('PulsePM: Importing links as files:', files);
      const { error } = await db.from('files').insert(files);
      if (error) {
        console.error('PulsePM: File import error:', error);
        // Don't throw - file import is optional
      }
    }
    
    state.aiSuggestions = [];
    renderAiResults();
    await loadAllData();
    showNotification(`Successfully imported ${selected.length} items!`, 'success');
  } catch (error) {
    console.error('Error importing:', error);
    alert('Failed to import: ' + (error.message || 'Unknown error'));
  }
});

// Example slideshow
document.querySelectorAll(".slider-dot").forEach((dot) => {
  dot.addEventListener("click", () => {
    currentSlide = parseInt(dot.dataset.slide);
    updateSlider();
  });
});

function updateSlider() {
  if (elements.exampleSlides) {
    elements.exampleSlides.style.transform = `translateX(-${currentSlide * 100}%)`;
  }
  document.querySelectorAll(".slider-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === currentSlide);
  });
}

setInterval(() => {
  currentSlide = (currentSlide + 1) % 3;
  updateSlider();
}, 5000);

function extractImportantItems(text) {
  const items = [];
  const seenTexts = new Set();
  
  // ========== 1. EXTRACT URLS/LINKS ==========
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
  const urls = text.match(urlRegex) || [];
  urls.forEach(url => {
    if (!seenTexts.has(url)) {
      seenTexts.add(url);
      items.push({
        text: url,
        type: 'link',
        priority: 'Medium',
        selected: true,
        icon: '🔗'
      });
    }
  });
  
  // ========== 2. EXTRACT ACTION ITEMS ==========
  // Action verb patterns that indicate tasks
  const actionPatterns = [
    /(?:need(?:s)?|needs? to|have to|has to|must|should|please|can you|could you|will you|would you)\s+(.{10,100})/gi,
    /(?:todo|to-do|action item|action required|follow up|follow-up)[\s:]+(.{10,100})/gi,
    /(?:^|\n)\s*[-*•]\s*(.{10,100})/gm,
    /(?:reminder|don't forget|remember to)[\s:]+(.{10,100})/gi,
    /(?:assigned to|@\w+)\s*[:-]?\s*(.{10,100})/gi,
  ];
  
  actionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let task = (match[1] || match[0]).trim();
      // Clean up the task text
      task = task.replace(/^[-*•:]\s*/, '').replace(/\s+/g, ' ').trim();
      if (task.length > 10 && task.length < 200 && !seenTexts.has(task.toLowerCase())) {
        seenTexts.add(task.toLowerCase());
        
        // Determine priority
        let priority = 'Medium';
        if (/urgent|asap|critical|emergency|immediately|sev\s?1|outage|down/i.test(task)) {
          priority = 'Critical';
        } else if (/high|important|deadline|eod|end of day|by today|due today/i.test(task)) {
          priority = 'High';
        } else if (/low|when you can|if possible|nice to have/i.test(task)) {
          priority = 'Low';
        }
        
        items.push({
          text: task,
          type: 'task',
          priority,
          selected: true,
          icon: '📋'
        });
      }
    }
  });
  
  // ========== 3. EXTRACT IMPORTANT INFO (dates, deadlines, mentions) ==========
  const importantPatterns = [
    /(?:deadline|due|due date|by|expires?|expiring)[\s:]+([^.!?\n]{5,80})/gi,
    /(?:meeting|call|sync|standup)[\s:]+([^.!?\n]{5,80})/gi,
    /(?:fyi|heads up|important|note|update)[\s:]+([^.!?\n]{10,100})/gi,
    /(?:blocked|blocker|blocking|waiting on|depends on)[\s:]+([^.!?\n]{5,80})/gi,
  ];
  
  importantPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let info = (match[1] || match[0]).trim();
      info = info.replace(/^[-*•:]\s*/, '').replace(/\s+/g, ' ').trim();
      if (info.length > 5 && info.length < 200 && !seenTexts.has(info.toLowerCase())) {
        seenTexts.add(info.toLowerCase());
        
        let priority = 'Medium';
        let icon = 'ℹ️';
        
        if (/blocked|blocker|blocking/i.test(match[0])) {
          priority = 'Critical';
          icon = '🚫';
        } else if (/deadline|expires?|urgent/i.test(match[0])) {
          priority = 'High';
          icon = '⚠️';
        } else if (/meeting|call/i.test(match[0])) {
          icon = '📅';
        }
        
        items.push({
          text: info,
          type: 'info',
          priority,
          selected: true,
          icon
        });
      }
    }
  });
  
  // ========== 4. SCAN SENTENCE BY SENTENCE FOR REMAINING IMPORTANT CONTENT ==========
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 15);
  const importantKeywords = ['urgent', 'asap', 'important', 'critical', 'blocked', 'deadline', 'due', 'required', 'mandatory', 'priority'];
  
  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase();
    if (importantKeywords.some(kw => lower.includes(kw)) && !seenTexts.has(lower)) {
      seenTexts.add(lower);
      
      let priority = 'Medium';
      if (/urgent|asap|critical|blocked/i.test(sentence)) priority = 'Critical';
      else if (/important|deadline|due|priority/i.test(sentence)) priority = 'High';
      
      items.push({
        text: sentence.substring(0, 150) + (sentence.length > 150 ? '...' : ''),
        type: 'task',
        priority,
        selected: true,
        icon: '📌'
      });
    }
  });
  
  // Sort by priority: Critical > High > Medium > Low
  const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return items.slice(0, 20); // Limit to 20 items
}

// ============================================
// RESET DATA
// ============================================
elements.seedDemo.addEventListener("click", async () => {
  if (confirm("This will delete ALL your data. Are you sure?")) {
    try {
      // Delete all data for current user (or all if admin)
      if (isAdmin()) {
        await db.from('todos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await db.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await db.from('files').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await db.from('invites').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      
      await loadAllData();
      showNotification('Data reset complete!', 'success');
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('Failed to reset data.');
    }
  }
});

// ============================================
// RENDER FUNCTIONS
// ============================================
function renderAll() {
  populateTaskAssigneeDropdown();
  renderTasks();
  renderTodos();
  renderFiles();
  renderMembers();
  renderInvites();
  renderMetrics();
  renderAiResults();
}

function renderTasks() {
  const filter = elements.taskFilter.value;
  const sort = elements.taskSort.value;
  let items = [...state.tasks];
  
  if (filter !== "All") items = items.filter((task) => task.priority === filter);
  if (sort === "priority") items.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
  if (sort === "due") items.sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
  if (sort === "status") items.sort((a, b) => a.status.localeCompare(b.status));

  const rows = [
    `<div class="table-row header">
      <div>Task</div>
      <div>Priority</div>
      <div>Status</div>
      <div>Assignee</div>
      <div>Team</div>
      <div></div>
    </div>`,
  ];

  items.forEach((task) => {
    rows.push(`
      <div class="table-row">
        <div>
          <strong>${escapeHtml(task.title || 'Untitled')}</strong>
          <div class="muted">${escapeHtml(task.notes || "No notes")}</div>
        </div>
        <div><span class="pill ${(task.priority || 'medium').toLowerCase()}">${task.priority || 'Medium'}</span></div>
        <div>
          <select data-task-status="${task.id}" ${!canEdit() ? "disabled" : ""}>
            ${renderStatusOptions(task.status || 'Not started')}
          </select>
        </div>
        <div>-</div>
        <div>-</div>
        <div class="danger ${!canEdit() ? "disabled" : ""}" data-task-delete="${task.id}">Remove</div>
      </div>
    `);
  });

  elements.taskTable.innerHTML = rows.join("");
  
  elements.taskTable.querySelectorAll("[data-task-status]").forEach((select) => {
    select.addEventListener("change", async (e) => {
      if (!canEdit()) return;
      try {
        await db
          .from('tasks')
          .update({ status: e.target.value })
          .eq('id', e.target.dataset.taskStatus);
        await loadAllData();
      } catch (error) {
        console.error('Error updating task:', error);
      }
    });
  });
  
  elements.taskTable.querySelectorAll("[data-task-delete]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      if (!canEdit()) return;
      try {
        await db.from('tasks').delete().eq('id', e.target.dataset.taskDelete);
        await loadAllData();
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task: ' + (error.message || 'Unknown error'));
      }
    });
  });
}

function renderTodos() {
  // All active todos (not done)
  const activeTodos = state.todos.filter((t) => t.status !== "Done");
  
  if (activeTodos.length === 0) {
    elements.unassignedTodos.innerHTML = `<div class="muted">No active todos. Create one above!</div>`;
  } else {
    elements.unassignedTodos.innerHTML = activeTodos.map((todo) => `
      <div class="unassigned-todo">
        <span class="pill ${statusClass(todo.status || 'Not started')}">${todo.status || 'Not started'}</span>
        <span class="todo-title">${escapeHtml(todo.text || 'Untitled')}</span>
        <span class="todo-progress">${todo.progress || 0}%</span>
        <button class="claim-btn" data-claim="${todo.id}">Work on it</button>
        ${canEdit() ? `
          <div class="todo-actions">
            <button class="todo-action-btn edit" data-edit="${todo.id}" title="Edit">✏️</button>
            <button class="todo-action-btn delete" data-delete="${todo.id}" title="Delete">🗑️</button>
          </div>
        ` : ''}
      </div>
    `).join("");
    
    elements.unassignedTodos.querySelectorAll("[data-claim]").forEach((btn) => {
      btn.addEventListener("click", (e) => claimTodo(e.target.dataset.claim));
    });
    
    elements.unassignedTodos.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openEditTodoModal(e.target.closest('[data-edit]').dataset.edit);
      });
    });
    
    elements.unassignedTodos.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openDeleteConfirmModal(e.target.closest('[data-delete]').dataset.delete);
      });
    });
  }
  
  // Show completed todos
  const completedTodos = state.todos.filter((t) => t.status === "Done");
  
  if (completedTodos.length === 0) {
    elements.userTodosGrid.innerHTML = `
      <div class="completed-section">
        <h3>✅ Completed</h3>
        <div class="muted" style="padding: 20px; text-align: center;">No completed todos yet</div>
      </div>
    `;
  } else {
    elements.userTodosGrid.innerHTML = `
      <div class="completed-section">
        <h3>✅ Completed (${completedTodos.length})</h3>
        <div class="completed-list">
          ${completedTodos.map((todo) => `
            <div class="completed-todo-item">
              <span class="todo-title">${escapeHtml(todo.text || 'Untitled')}</span>
              ${canEdit() ? `<button class="todo-action-btn delete" data-delete="${todo.id}" title="Delete">🗑️</button>` : ''}
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }
  
  // Attach delete listeners for completed todos
  elements.userTodosGrid.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openDeleteConfirmModal(e.target.closest('[data-delete]').dataset.delete);
    });
  });
}

function renderFiles() {
  // Get filter values
  const searchTerm = (document.getElementById('file-search')?.value || '').toLowerCase();
  const typeFilter = document.getElementById('file-type-filter')?.value || 'all';
  
  // Filter files
  let filteredFiles = state.files.filter(file => {
    const fileName = (file.name || '').toLowerCase();
    const matchesSearch = !searchTerm || fileName.includes(searchTerm);
    
    if (!matchesSearch) return false;
    if (typeFilter === 'all') return true;
    
    const ext = fileName.split('.').pop().toLowerCase();
    const fileType = file.type || '';
    
    switch (typeFilter) {
      case 'document': return ['doc', 'docx', 'pdf', 'txt'].includes(ext);
      case 'spreadsheet': return ['xls', 'xlsx', 'csv'].includes(ext);
      case 'link': return fileType === 'link' || file.link;
      case 'image': return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
      default: return true;
    }
  });
  
  if (filteredFiles.length === 0) {
    elements.fileList.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.3;">📁</div>
        <p style="color: var(--gray-400);">${state.files.length === 0 ? 'No files shared yet' : 'No files match your filter'}</p>
        ${state.files.length === 0 ? `<button class="primary" style="margin-top: 16px;" onclick="document.getElementById('add-file-btn').click()">Upload First File</button>` : ''}
      </div>
    `;
    return;
  }
  
  elements.fileList.innerHTML = filteredFiles.map((file) => {
    const fileName = file.name || 'Unknown File';
    const fileType = file.type || 'file';
    const icon = getFileIcon(fileType, fileName);
    const ext = fileName.split(".").pop().toUpperCase();
    
    return `
      <div class="file-card" data-file-id="${file.id}">
        <div class="file-preview">
          <div class="file-icon ${icon.class}">${icon.icon}</div>
          <span class="file-type-label">${fileType === "link" ? "LINK" : ext}</span>
        </div>
        <div class="file-info">
          <div class="file-name">${escapeHtml(fileName)}</div>
          <div class="file-meta">${fileType === "link" ? "External link" : formatFileSize(file.size || 0)}</div>
          <div class="file-actions">
            ${file.link 
              ? `<a href="${file.link}" target="_blank" rel="noreferrer" class="file-btn download">Open Link</a>`
              : `<span class="muted" style="font-size: 12px;">File stored</span>`
            }
            ${canEdit() ? `
              <button class="file-btn edit" data-edit-file="${file.id}" title="Edit">✏️</button>
              <button class="file-btn delete" data-delete-file="${file.id}" title="Delete">🗑️</button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join("");
  
  // Attach event listeners for edit/delete
  document.querySelectorAll('[data-edit-file]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const fileId = e.target.dataset.editFile;
      openEditFileModal(fileId);
    });
  });
  
  document.querySelectorAll('[data-delete-file]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const fileId = e.target.dataset.deleteFile;
      openDeleteFileModal(fileId);
    });
  });
}

function renderMembers() {
  elements.memberCount.textContent = `${profiles.length} member${profiles.length !== 1 ? "s" : ""}`;

  const rows = [
    `<div class="member-row header">
      <div>Name</div>
      <div>Role</div>
      <div>Department</div>
      <div>Permissions</div>
      <div></div>
    </div>`,
  ];

  profiles.forEach((profile) => {
    const isCurrentUser = profile.id === currentUser?.id;
    const permTags = [];
    if (profile.permissions?.admin) permTags.push(`<span class="tag admin-badge">Admin</span>`);
    if (profile.permissions?.edit) permTags.push(`<span class="tag">Edit</span>`);
    if (profile.permissions?.see) permTags.push(`<span class="tag">View</span>`);
    if (profile.permissions?.share) permTags.push(`<span class="tag">Share</span>`);

    rows.push(`
      <div class="member-row ${isCurrentUser ? "current-user" : ""}">
        <div>
          <strong>${escapeHtml(profile.name)}</strong>
          <div class="muted">${escapeHtml(profile.email)}</div>
        </div>
        <div><span>${escapeHtml(profile.role)}</span></div>
        <div>${escapeHtml(profile.department)}</div>
        <div class="permissions">${permTags.join("")}</div>
        <div class="member-actions">
          ${isAdmin() && !isCurrentUser ? `
            <button class="edit-perm-btn" data-edit-perm="${profile.id}" title="Edit Permissions">✏️ Edit</button>
            <span class="danger" data-user-delete="${profile.id}">Remove</span>
          ` : ""}
        </div>
      </div>
    `);
  });

  elements.memberList.innerHTML = rows.join("");

  // Edit permissions buttons
  elements.memberList.querySelectorAll("[data-edit-perm]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (!isAdmin()) return;
      openEditPermissionsModal(e.target.closest('[data-edit-perm]').dataset.editPerm);
    });
  });

  elements.memberList.querySelectorAll("[data-user-delete]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      if (!isAdmin()) return;
      if (confirm("Are you sure you want to remove this user?")) {
        try {
          // Note: In production, you'd also delete from auth.users via admin API
          await db.from('profiles').delete().eq('id', e.target.dataset.userDelete);
          await loadAllData();
        } catch (error) {
          console.error('Error deleting user:', error);
        }
      }
    });
  });
}

function renderInvites() {
  const activeInvites = invites.filter((i) => !i.used);
  
  const inviteCount = document.getElementById("invite-count");
  if (inviteCount) {
    inviteCount.textContent = activeInvites.length;
  }
  
  if (!activeInvites.length) {
    elements.inviteList.innerHTML = `<div class="muted">No pending invites. Click "Invite User" above to create one.</div>`;
    return;
  }

  elements.inviteList.innerHTML = activeInvites.map((invite) => {
    const permList = [];
    if (invite.permissions?.admin) permList.push("Admin");
    if (invite.permissions?.edit) permList.push("Edit");
    if (invite.permissions?.see) permList.push("View");
    if (invite.permissions?.share) permList.push("Share");

    return `
      <div class="list-item">
        <div class="list-item-header">
          <div>
            <strong style="font-family: monospace; letter-spacing: 1px;">${escapeHtml(invite.code)}</strong>
            <div class="muted">Role: ${escapeHtml(invite.role)}</div>
          </div>
          <div class="muted">by ${escapeHtml(invite.created_by_name || 'Admin')}</div>
        </div>
        <div class="permissions">${permList.map((p) => `<span class="tag">${p}</span>`).join("")}</div>
        ${isAdmin() ? `<div class="danger" data-invite-delete="${invite.id}">Revoke</div>` : ""}
      </div>
    `;
  }).join("");

  elements.inviteList.querySelectorAll("[data-invite-delete]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      if (!isAdmin()) return;
      try {
        await db.from('invites').delete().eq('id', e.target.dataset.inviteDelete);
        await loadAllData();
      } catch (error) {
        console.error('Error deleting invite:', error);
      }
    });
  });
}

function renderAiResults() {
  if (!state.aiSuggestions.length) {
    elements.aiResults.innerHTML = `
      <div class="muted" style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;">⚡</div>
        <div>Paste Teams content and click "Scan & Extract"</div>
        <div style="margin-top: 8px; font-size: 12px;">AI will identify action items, links, priorities, and blockers</div>
      </div>
    `;
    return;
  }
  
  // Group by type for summary
  const links = state.aiSuggestions.filter(i => i.type === 'link').length;
  const tasks = state.aiSuggestions.filter(i => i.type === 'task').length;
  const infos = state.aiSuggestions.filter(i => i.type === 'info').length;
  
  const summary = `
    <div class="ai-summary" style="padding: 8px 12px; background: var(--gray-800); border-radius: 8px; margin-bottom: 12px; font-size: 12px; display: flex; gap: 16px;">
      <span>🔗 ${links} links</span>
      <span>📋 ${tasks} tasks</span>
      <span>ℹ️ ${infos} info</span>
      <span style="margin-left: auto; color: var(--yellow);">${state.aiSuggestions.filter(i => i.selected).length} selected</span>
    </div>
  `;
  
  const itemsHtml = state.aiSuggestions.map((item, index) => {
    const typeLabel = item.type === 'link' ? 'LINK' : item.type === 'task' ? 'TASK' : 'INFO';
    const typeClass = item.type === 'link' ? 'link-type' : item.type === 'task' ? 'task-type' : 'info-type';
    
    return `
      <div class="ai-result-item" data-type="${item.type}">
        <input type="checkbox" data-ai-index="${index}" ${item.selected ? "checked" : ""} />
        <span class="ai-result-icon">${item.icon || '📌'}</span>
        <span class="ai-result-text" title="${escapeHtml(item.text)}">${escapeHtml(item.text.length > 80 ? item.text.substring(0, 80) + '...' : item.text)}</span>
        <span class="ai-type-badge ${typeClass}">${typeLabel}</span>
        <span class="pill ${item.priority.toLowerCase()}">${item.priority}</span>
      </div>
    `;
  }).join("");
  
  elements.aiResults.innerHTML = summary + itemsHtml;
  
  elements.aiResults.querySelectorAll("[data-ai-index]").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const item = state.aiSuggestions[parseInt(e.target.dataset.aiIndex)];
      if (item) item.selected = e.target.checked;
      // Update the summary count
      const summarySelected = elements.aiResults.querySelector('.ai-summary span:last-child');
      if (summarySelected) {
        summarySelected.textContent = `${state.aiSuggestions.filter(i => i.selected).length} selected`;
      }
    });
  });
}

function renderMetrics() {
  const openTasks = state.tasks.filter((t) => t.status !== "Done").length;
  elements.metricTasks.textContent = openTasks;
  
  const progress = state.todos.length
    ? Math.round(state.todos.reduce((sum, t) => sum + (t.progress || 0), 0) / state.todos.length)
    : 0;
  elements.metricProgress.textContent = `${progress}%`;
  elements.metricFiles.textContent = state.files.length;
  
  const metricTeam = document.getElementById("metric-team");
  if (metricTeam) metricTeam.textContent = profiles.length;
  
  const dashboardUserName = document.getElementById("dashboard-user-name");
  if (dashboardUserName && currentProfile) {
    dashboardUserName.textContent = currentProfile.name.split(" ")[0];
  }
  
  updateDateTime();

  // Priority list
  const topTasks = [...state.tasks]
    .filter((t) => t.status !== "Done")
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    .slice(0, 4);
  
  if (topTasks.length === 0) {
    elements.priorityList.innerHTML = `
      <div class="muted" style="text-align: center; padding: 24px;">
        <div style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;">✨</div>
        <div>No open tasks - you're all caught up!</div>
      </div>
    `;
  } else {
    elements.priorityList.innerHTML = topTasks.map((task, i) => {
      const priority = task.priority || 'Medium';
      const rankClass = priority === "Critical" ? "p1" : priority === "High" ? "p2" : "p3";
      return `
        <div class="priority-item">
          <div class="priority-rank ${rankClass}">${i + 1}</div>
          <div class="priority-info">
            <div class="priority-title">${escapeHtml(task.title || 'Untitled')}</div>
            <div class="priority-meta">${escapeHtml(task.status || 'Not started')}</div>
          </div>
          <span class="pill ${priority.toLowerCase()}">${priority}</span>
        </div>
      `;
    }).join("");
  }

  // Activity list
  const recentItems = [
    ...state.tasks.slice(0, 3).map((t) => ({ type: "task", item: t, icon: "📋" })),
    ...state.todos.slice(0, 3).map((t) => ({ type: "todo", item: t, icon: "✓" })),
    ...state.files.slice(0, 2).map((f) => ({ type: "file", item: f, icon: "📁" })),
  ].slice(0, 5);
  
  if (recentItems.length === 0) {
    elements.activityList.innerHTML = `
      <div class="muted" style="text-align: center; padding: 24px;">
        <div style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;">📭</div>
        <div>No recent activity</div>
      </div>
    `;
  } else {
    elements.activityList.innerHTML = recentItems.map((entry) => {
      const title = entry.item.title || entry.item.text || entry.item.name || 'Untitled';
      const typeLabel = entry.type === "task" ? "Task created" : entry.type === "todo" ? "Todo added" : "File uploaded";
      return `
        <div class="activity-item">
          <div class="activity-icon">${entry.icon}</div>
          <div class="activity-content">
            <div class="activity-text"><strong>${escapeHtml(title)}</strong></div>
            <div class="activity-time">${typeLabel}</div>
          </div>
        </div>
      `;
    }).join("");
  }
  
  // Team overview
  const teamOverview = document.getElementById("team-overview");
  if (teamOverview) {
    const displayUsers = profiles.slice(0, 5);
    if (displayUsers.length === 0) {
      teamOverview.innerHTML = `<div class="muted">No team members yet</div>`;
    } else {
      teamOverview.innerHTML = displayUsers.map((profile) => `
        <div class="team-member-row">
          <div class="team-member-avatar">${profile.name.charAt(0).toUpperCase()}</div>
          <div class="team-member-info">
            <div class="team-member-name">${escapeHtml(profile.name)}</div>
            <div class="team-member-role">${escapeHtml(profile.role)}</div>
          </div>
          <div class="team-member-status"></div>
        </div>
      `).join("");
    }
  }
}

function updateDateTime() {
  const dateEl = document.getElementById("current-date");
  const timeEl = document.getElementById("current-time");
  
  if (dateEl && timeEl) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', options);
    timeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}

setInterval(updateDateTime, 60000);

// ============================================
// CALENDAR UI
// ============================================
let calendarDate = new Date();
let selectedDate = null;
let activeCalendarInput = null;

const calendarModal = document.getElementById("calendar-modal");
const calMonthYear = document.getElementById("cal-month-year");
const calDays = document.getElementById("cal-days");
const calPrev = document.getElementById("cal-prev");
const calNext = document.getElementById("cal-next");
const calToday = document.getElementById("cal-today");
const calClear = document.getElementById("cal-clear");
const calClose = document.getElementById("cal-close");

const monthNames = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];

function openCalendar(inputElement, hiddenInput) {
  activeCalendarInput = { display: inputElement, hidden: hiddenInput };
  
  if (hiddenInput && hiddenInput.value) {
    const parts = hiddenInput.value.split("-");
    if (parts.length === 3) {
      calendarDate = new Date(parts[0], parts[1] - 1, parts[2]);
      selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
    }
  } else {
    calendarDate = new Date();
    selectedDate = null;
  }
  
  renderCalendar();
  calendarModal.classList.remove("hidden");
}

function closeCalendar() {
  calendarModal.classList.add("hidden");
  activeCalendarInput = null;
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  
  calMonthYear.textContent = `${monthNames[month]} ${year}`;
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let html = "";
  
  const prevMonth = new Date(year, month, 0);
  const prevDays = prevMonth.getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevDays - i;
    html += `<div class="calendar-day other-month" data-date="${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}">${day}</div>`;
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    let classes = ["calendar-day"];
    
    if (date.getTime() === today.getTime()) {
      classes.push("today");
    }
    
    if (date < today) {
      classes.push("past");
    }
    
    if (date.getDay() === 0 || date.getDay() === 6) {
      classes.push("weekend");
    }
    
    if (selectedDate && date.getTime() === selectedDate.getTime()) {
      classes.push("selected");
    }
    
    html += `<div class="${classes.join(" ")}" data-date="${dateStr}">${day}</div>`;
  }
  
  const remaining = 42 - (startDay + daysInMonth);
  for (let day = 1; day <= remaining; day++) {
    const nextMonth = month + 2;
    const nextYear = nextMonth > 12 ? year + 1 : year;
    const actualMonth = nextMonth > 12 ? 1 : nextMonth;
    html += `<div class="calendar-day other-month" data-date="${nextYear}-${String(actualMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}">${day}</div>`;
  }
  
  calDays.innerHTML = html;
  
  calDays.querySelectorAll(".calendar-day:not(.empty)").forEach((dayEl) => {
    dayEl.addEventListener("click", () => {
      const dateStr = dayEl.dataset.date;
      const parts = dateStr.split("-");
      selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
      
      if (dayEl.classList.contains("other-month")) {
        calendarDate = new Date(selectedDate);
      }
      
      renderCalendar();
    });
  });
}

calPrev.addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});

calNext.addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

calToday.addEventListener("click", () => {
  const today = new Date();
  calendarDate = new Date(today);
  selectedDate = new Date(today);
  selectedDate.setHours(0, 0, 0, 0);
  renderCalendar();
});

calClear.addEventListener("click", () => {
  selectedDate = null;
  if (activeCalendarInput) {
    activeCalendarInput.display.value = "";
    if (activeCalendarInput.hidden) {
      activeCalendarInput.hidden.value = "";
    }
  }
  renderCalendar();
});

calClose.addEventListener("click", () => {
  if (selectedDate && activeCalendarInput) {
    const dateStr = formatDateForInput(selectedDate);
    const displayStr = formatDateForDisplay(selectedDate);
    
    activeCalendarInput.display.value = displayStr;
    if (activeCalendarInput.hidden) {
      activeCalendarInput.hidden.value = dateStr;
    }
  }
  closeCalendar();
});

calendarModal.addEventListener("click", (e) => {
  if (e.target === calendarModal) {
    closeCalendar();
  }
});

function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(date) {
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const options = { month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

const taskDueInput = document.getElementById("task-due");
const taskDueHidden = document.getElementById("task-due-hidden");

if (taskDueInput) {
  taskDueInput.addEventListener("click", () => {
    openCalendar(taskDueInput, taskDueHidden);
  });
}

// ============================================
// HELPERS
// ============================================
function statusClass(status) {
  if (status === "Done") return "done";
  if (status === "Blocked") return "blocked";
  return "progress";
}

function renderStatusOptions(current) {
  return ["Not started", "In progress", "Blocked", "Done"]
    .map((s) => `<option value="${s}" ${s === current ? "selected" : ""}>${s}</option>`)
    .join("");
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showNotification(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // Could add toast notification UI here
}

// ============================================
// SPLASH SCREEN
// ============================================
const splashScreen = document.getElementById("splash-screen");
const splashUserName = document.getElementById("splash-user-name");
const splashParticles = document.getElementById("splash-particles");

function createParticles() {
  if (!splashParticles) return;
  
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement("div");
    particle.className = "splash-particle";
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 5}s`;
    particle.style.animationDuration = `${6 + Math.random() * 4}s`;
    splashParticles.appendChild(particle);
  }
}

function showSplashScreen(userName) {
  if (!splashScreen || !splashUserName) return;
  
  const firstName = userName.split(" ")[0];
  splashUserName.innerHTML = `<span>${escapeHtml(firstName)}</span>`;
  
  createParticles();
  
  splashScreen.classList.remove("hidden", "fade-out");
  
  setTimeout(() => {
    splashScreen.classList.add("fade-out");
    
    setTimeout(() => {
      splashScreen.classList.add("hidden");
      if (splashParticles) splashParticles.innerHTML = "";
    }, 800);
  }, 3000);
}

function hideSplashScreen() {
  if (splashScreen) {
    splashScreen.classList.add("hidden");
  }
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================
function setupRealtimeSubscriptions() {
  // Subscribe to tasks changes
  db
    .channel('tasks-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
      loadAllData();
    })
    .subscribe();

  // Subscribe to todos changes
  db
    .channel('todos-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, () => {
      loadAllData();
    })
    .subscribe();

  // Subscribe to profiles changes
  db
    .channel('profiles-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
      loadAllData();
    })
    .subscribe();

  // Subscribe to files changes
  db
    .channel('files-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'files' }, () => {
      loadAllData();
    })
    .subscribe();

  // Subscribe to invites changes
  db
    .channel('invites-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'invites' }, () => {
      loadAllData();
    })
    .subscribe();
}

// ============================================
// CHECK INVITE IN URL
// ============================================
async function checkInviteInUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get('invite');
  
  if (inviteCode) {
    const { data: invite, error } = await db
      .from('invites')
      .select('*')
      .eq('code', inviteCode)
      .eq('used', false)
      .single();
    
    if (!error && invite) {
      elements.registerInvite.value = inviteCode;
      
      const inviteWelcome = document.createElement('div');
      inviteWelcome.className = 'invite-welcome-banner';
      inviteWelcome.innerHTML = `
        <div class="invite-banner-content">
          <span class="invite-banner-icon">🎉</span>
          <div>
            <strong>You've been invited!</strong>
            <p>Create your account to join as ${invite.role}</p>
          </div>
        </div>
      `;
      
      const registerForm = document.getElementById('register-form');
      if (registerForm && !document.querySelector('.invite-welcome-banner')) {
        registerForm.insertBefore(inviteWelcome, registerForm.firstChild);
      }
      
      return true;
    } else {
      alert('This invite link is invalid or has already been used.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
  return false;
}

// ============================================
// INITIALIZATION
// ============================================
async function initialize() {
  console.log('PulsePM: Starting initialization...');
  hideSplashScreen();
  
  // Check if Supabase is configured
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    alert('Please configure Supabase in config.js first. See README.md for instructions.');
    showAuthModal();
    showLoginForm();
    return;
  }
  
  try {
    // Check for existing session
    console.log('PulsePM: Checking for existing session...');
    const { data: { session }, error: sessionError } = await db.auth.getSession();
    
    if (sessionError) {
      console.error('PulsePM: Session error:', sessionError);
      throw sessionError;
    }
    
    if (session) {
      console.log('PulsePM: Session found, loading profile...');
      currentUser = session.user;
      
      // Load profile
      const { data: profile, error } = await db
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (!error && profile) {
        console.log('PulsePM: Profile loaded, setting up UI...');
        currentProfile = profile;
        hideAuthModal();
        updateUserUI();
        setActiveSection("dashboard");
        await loadAllData();
        setupRealtimeSubscriptions();
        showSplashScreen(profile.name);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        console.log('PulsePM: No profile found, showing auth modal...');
        // Profile doesn't exist, sign out
        await db.auth.signOut();
        showAuthModal();
        const hasInvite = await checkInviteInUrl();
        if (hasInvite) {
          showRegisterForm();
        } else {
          showLoginForm();
        }
      }
    } else {
      console.log('PulsePM: No session, showing auth modal...');
      showAuthModal();
      const hasInvite = await checkInviteInUrl();
      if (hasInvite) {
        showRegisterForm();
      } else {
        showLoginForm();
      }
    }
    
    // Listen for auth changes
    db.auth.onAuthStateChange(async (event, session) => {
      console.log('PulsePM: Auth state changed:', event);
      if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentProfile = null;
        state = { tasks: [], todos: [], files: [], aiSuggestions: [] };
        profiles = [];
        invites = [];
      }
    });
    
    console.log('PulsePM: Initialization complete!');
  } catch (error) {
    console.error('PulsePM: Initialization error:', error);
    showAuthModal();
    showLoginForm();
  }
}

// Start the app
initialize();
