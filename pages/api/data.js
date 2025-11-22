// pages/api/data.js

import prisma from '../../lib/db';
import { verifyToken } from '../../lib/auth';

// Define the role options as constants (SQLite compatible replacement for Prisma enum)
const UserRole = {
    Admin: 'Admin',
    Manager: 'Manager',
    User: 'User'
};

// Helper for sending 403 Access Denied
const unauthorized = (res) => {
  res.status(403).json({ message: 'Access Denied: Insufficient permissions for this action.' });
};

// Helper for sending 404 Not Found
const notFound = (res) => {
  res.status(404).json({ message: 'Resource not found.' });
};

// --- CORE HANDLER ---

export default async function handler(req, res) {
  // 1. Authentication and Role Check (JWT/Auth with protected routes)
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token or session expired.' });
  }

  const { userId, role } = decoded;
  const { resource, id } = req.query; // e.g., resource=users, id=123
  const { method } = req;
  const body = req.body;

  // 2. Role-Based Authorization Logic (RBAC)
  try {
    switch (resource) {
      
      // --- RESOURCE: USERS / PROFILE ---
      case 'users':
      case 'profile':
        return handleUserResource(method, res, role, id, body, userId);

      // --- RESOURCE: PROJECTS ---
      case 'projects':
        return handleProjectResource(method, res, role, id, body, userId);

      // --- RESOURCE: TASKS ---
      case 'tasks':
        return handleTaskResource(method, res, role, id, body, userId);

      // --- RESOURCE: REPORTS ---
      case 'reports':
        if (role !== UserRole.Admin) return unauthorized(res); // Admin-Only
        return handleReports(res);
        
      default:
        return notFound(res);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ message: 'Internal Server Error.', error: error.message });
  }
}

// --- IMPLEMENTATION FUNCTIONS ---

async function handleUserResource(method, res, role, id, body, currentUserId) {
    
    // GET /api/data?resource=users (Admin: View all users)
    if (method === 'GET' && !id) {
        if (role !== UserRole.Admin) return unauthorized(res);
        const users = await prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true, role: true } });
        return res.status(200).json(users);
    }
    
    // PUT /api/data?resource=profile (All: View/edit own profile)
    if (method === 'PUT' && id === 'profile') {
        const { firstName, lastName } = body;
        const updatedUser = await prisma.user.update({
            where: { id: currentUserId },
            data: { firstName, lastName },
            select: { id: true, email: true, firstName: true, lastName: true, role: true }
        });
        return res.status(200).json(updatedUser);
    }
    
    // POST /api/data?resource=users (Admin: Add user)
    if (method === 'POST') {
        if (role !== UserRole.Admin) return unauthorized(res);
        // Simplified: assuming body includes email, rawPassword, and desired role
        // In a real app, hash password before saving
        return res.status(201).json({ message: 'User created (Admin logic needed)' });
    }
    
    // DELETE /api/data?resource=users&id=X (Admin: Delete user)
    if (method === 'DELETE' && id) {
        if (role !== UserRole.Admin) return unauthorized(res);
        await prisma.user.delete({ where: { id } });
        return res.status(200).json({ message: 'User deleted.' });
    }

    return notFound(res);
}

// --- PROJECT IMPLEMENTATION (Fully Functional for Manager) ---
async function handleProjectResource(method, res, role, id, body, currentUserId) {
    // RBAC: User role cannot access Project resource
    if (role === UserRole.User) return unauthorized(res);

    // GET: View all projects (for Admin/Manager)
    if (method === 'GET') {
        const projects = await prisma.project.findMany({ 
            // Include manager info and task count for the dashboard
            include: { manager: { select: { email: true } }, tasks: { select: { id: true } } } 
        });
        const projectsWithTaskCount = projects.map(p => ({
            ...p,
            taskCount: p.tasks.length,
        }));
        return res.status(200).json(projectsWithTaskCount);
    }
    
    // POST: Create project (Admin/Manager)
    if (method === 'POST') {
        const { name, description } = body;
        const newProject = await prisma.project.create({
            data: { name, description, managerId: currentUserId } // Manager is the current logged-in user
        });
        return res.status(201).json(newProject);
    }
    
    // PUT: Edit project
    if (method === 'PUT' && id) {
        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return notFound(res);
        
        // RBAC: Only Admin OR the project's Manager can edit
        if (role !== UserRole.Admin && project.managerId !== currentUserId) {
            return res.status(403).json({ message: 'Access Denied: You are not the project manager.' });
        }
        
        const updatedProject = await prisma.project.update({
            where: { id },
            data: body
        });
        return res.status(200).json(updatedProject);
    }
    
    // DELETE: Delete project
    if (method === 'DELETE' && id) {
        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return notFound(res);
        
        // RBAC: Only Admin OR the project's Manager can delete
        if (role !== UserRole.Admin && project.managerId !== currentUserId) {
            return res.status(403).json({ message: 'Access Denied: You are not the project manager.' });
        }
        
        // Delete dependent tasks first
        await prisma.task.deleteMany({ where: { projectId: id } });
        await prisma.project.delete({ where: { id } });
        return res.status(200).json({ message: 'Project deleted.' });
    }

    return notFound(res);
}

// --- TASK IMPLEMENTATION (Updated for Manager Team View) ---
async function handleTaskResource(method, res, role, id, body, currentUserId) {
    
    // GET: View tasks
    if (method === 'GET' && !id) {
        let whereClause = {};
        if (role === UserRole.User) {
            whereClause = { assignedToId: currentUserId };
        }
        
        const tasks = await prisma.task.findMany({ 
            where: whereClause, 
            include: { 
                assignedTo: { select: { firstName: true, lastName: true, email: true } }, 
                project: { select: { name: true } } 
            } 
        });
        
        // Flatten data for the frontend table
        const displayTasks = tasks.map(t => ({
            ...t,
            user: `${t.assignedTo.firstName} ${t.assignedTo.lastName}`,
            project: t.project.name,
        }));
        
        return res.status(200).json(displayTasks);
    }

    // POST: Create/Assign Task (Admin/Manager)
    if (method === 'POST') {
        if (role === UserRole.User) return unauthorized(res);
        const { title, description, projectId, assignedToId } = body;
        const newTask = await prisma.task.create({
            data: { title, description, projectId, assignedToId, status: 'ToDo' }
        });
        return res.status(201).json(newTask);
    }
    
    // PUT: Update Task (for status change or Manager edit)
    if (method === 'PUT' && id) {
        const task = await prisma.task.findUnique({ where: { id } });
        if (!task) return notFound(res);
        
        if (role === UserRole.User && task.assignedToId !== currentUserId) {
            return res.status(403).json({ message: 'Access Denied: You can only update your own tasks.' }); 
        }
        
        const updatedTask = await prisma.task.update({
            where: { id },
            data: body
        });
        return res.status(200).json(updatedTask);
    }
    
    return notFound(res);
}


async function handleReports(res) {
    // Admin-Only: View total users, projects, active tasks
    const totalUsers = await prisma.user.count();
    const totalProjects = await prisma.project.count();
    const activeTasks = await prisma.task.count({ where: { status: { not: 'Done' } } });
    
    return res.status(200).json({ totalUsers, totalProjects, activeTasks });
}