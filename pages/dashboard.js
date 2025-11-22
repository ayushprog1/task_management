// pages/dashboard.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth, withAuth } from '../lib/auth';import Layout from '../components/layout';
import { Card, DataTable, StatusBadge } from '../components/reusable';

// --- Dashboard Component Structure ---

// Define the available views for each role
const RoleViews = {
    Admin: ['dashboard', 'users', 'reports'],
    Manager: ['projects', 'team'],
    User: ['tasks'],
};

// --- Admin-Only View ---
const AdminDashboard = ({ view }) => {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const fetchAdminData = async (resource) => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/data?resource=${resource}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                if (resource === 'users') setUsers(data);
                if (resource === 'reports') setReports(data);
            } else {
                console.error(`Failed to fetch ${resource}:`, data.message);
            }
        } catch (error) {
            console.error(`Fetch error for ${resource}:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'users') {
            fetchAdminData('users');
        } else if (view === 'reports') {
            fetchAdminData('reports');
        }
    }, [view, token]);

    if (view === 'dashboard') {
        return <Card title="🏠 Admin Dashboard Overview">Welcome to the full system dashboard.</Card>;
    }

    if (view === 'users') {
        const userColumns = [
            { header: 'Email', key: 'email' },
            { header: 'Name', key: 'firstName', render: (row) => `${row.firstName || ''} ${row.lastName || ''}` },
            { header: 'Role', key: 'role', render: (row) => <StatusBadge status={row.role} /> }
        ];
        return (
            <Card title="👤 User Management">
                <button 
                    onClick={() => alert('Add User Form logic here...')}
                    className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    Add New User
                </button>
                {isLoading ? (
                    <p>Loading users...</p>
                ) : (
                    <DataTable 
                        columns={userColumns} 
                        data={users} 
                        onEdit={(row) => alert(`Editing user: ${row.email}`)}
                        onDelete={(row) => alert(`Deleting user: ${row.email}`)}
                    />
                )}
            </Card>
        );
    }
    
    if (view === 'reports') {
        return (
            <Card title="📊 System Reports">
                {isLoading ? (
                    <p>Loading reports...</p>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        <Card title="Total Users" className="bg-gray-100">{reports.totalUsers}</Card>
                        <Card title="Total Projects" className="bg-gray-100">{reports.totalProjects}</Card>
                        <Card title="Active Tasks" className="bg-gray-100">{reports.activeTasks}</Card>
                    </div>
                )}
            </Card>
        );
    }

    return <div>Admin Welcome Page</div>;
};

// --- Manager-Only View (Fully Functional Project Management) ---
const ManagerDashboard = ({ view }) => {
    const { token, user } = useAuth(); // user object needed to check current user ID
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Helper function for fetching data
    const fetchManagerData = async (resource) => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/data?resource=${resource}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                if (resource === 'projects') setProjects(data);
                if (resource === 'tasks') setTasks(data);
            } else {
                console.error(`Failed to fetch ${resource}:`, data.message);
            }
        } catch (error) {
            console.error(`Fetch error for ${resource}:`, error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Fetch projects or tasks based on the current view whenever 'view' or 'token' changes
    useEffect(() => {
        if (view === 'projects') {
            fetchManagerData('projects');
        } else if (view === 'team') {
            fetchManagerData('tasks');
        }
    }, [view, token]);

    // Handle Project CRUD Actions
    const handleProjectAction = async (action, projectData = {}) => {
        if (!token) return;
        
        let url = `/api/data?resource=projects`;
        let method = 'POST';
        
        // Determine method and URL based on action
        if (action === 'delete') {
            if (!confirm(`Are you sure you want to delete project: ${projectData.name}?`)) return;
            url = `/api/data?resource=projects&id=${projectData.id}`;
            method = 'DELETE';
        } else if (action === 'edit') {
            url = `/api/data?resource=projects&id=${projectData.id}`;
            method = 'PUT';
        }
        
        // Prepare body for POST/PUT (simplified, a real app would use a modal form)
        let body = projectData;
        if (action === 'create') {
            const name = prompt("Enter new project name:");
            if (!name) return;
            body = { name: name, description: `Project managed by ${user.firstName}` };
        } else if (action === 'edit') {
             const name = prompt(`New name for ${projectData.name}:`, projectData.name);
             if (!name) return;
             body = { name: name };
        }

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: ['POST', 'PUT'].includes(method) ? JSON.stringify(body) : null
            });

            if (res.ok) {
                alert(`Project ${action} successful!`);
                fetchManagerData('projects'); // Refresh list
            } else {
                const data = await res.json();
                alert(`Project ${action} failed: ${data.message}`);
            }
        } catch (error) {
            alert(`Network error during project ${action}.`);
        }
    };

    // --- Manager Views ---
    
    if (view === 'projects') {
        const projectColumns = [
            { header: 'Project Name', key: 'name' },
            { header: 'Manager', key: 'manager', render: (row) => row.manager.email }, 
            { header: 'Tasks', key: 'taskCount' },
            { header: 'Action', key: 'actions', render: (row) => (
                <div className="space-x-2">
                    <button 
                        onClick={() => handleProjectAction('edit', row)}
                        className="text-indigo-600 hover:text-indigo-900"
                    >
                        Edit
                    </button>
                    <button 
                        onClick={() => handleProjectAction('delete', row)}
                        className="text-red-600 hover:text-red-900"
                    >
                        Delete
                    </button>
                </div>
            )}
        ];
        return (
            <Card title="🗂️ Project Management">
                <button 
                    onClick={() => handleProjectAction('create')}
                    className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    Create New Project
                </button>
                {isLoading ? (
                    <p>Loading projects...</p>
                ) : (
                    <DataTable 
                        columns={projectColumns} 
                        data={projects}
                        showActions={false} // Actions handled by custom render
                    />
                )}
            </Card>
        );
    }

    if (view === 'team') {
        const taskColumns = [
            { header: 'Task Title', key: 'title' },
            { header: 'Project', key: 'project' },
            { header: 'Assigned To', key: 'user' },
            { header: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> }
        ];
        return (
            <Card title="🧑‍🤝‍🧑 Team View: Task Monitoring">
                <button 
                    onClick={() => alert('Assignment Form logic would go here, calling POST /api/data?resource=tasks')}
                    className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    Assign New Task (Placeholder)
                </button>
                {isLoading ? (
                    <p>Loading team tasks...</p>
                ) : (
                    <DataTable 
                        columns={taskColumns} 
                        data={tasks}
                        showActions={false}
                    />
                )}
            </Card>
        );
    }

    return <div>Manager Welcome Page</div>;
};

// --- User-Only View ---
const UserDashboard = ({ view }) => {
    const { token, user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Fetch assigned tasks
    const fetchTasks = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/data?resource=tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setTasks(data);
            } else {
                console.error('Failed to fetch tasks:', data.message);
            }
        } catch (error) {
            console.error('Fetch error for tasks:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (view === 'tasks') {
            fetchTasks();
        }
    }, [view, token]);

    // Handle task status update
    const handleStatusUpdate = async (taskId, newStatus) => {
        if (!token) return;

        try {
            const res = await fetch(`/api/data?resource=tasks&id=${taskId}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                alert(`Task status updated to ${newStatus}!`);
                fetchTasks(); // Refresh list
            } else {
                const data = await res.json();
                alert(`Update failed: ${data.message}`);
            }
        } catch (error) {
            alert('Network error during status update.');
        }
    };

    if (view === 'tasks') {
        const taskColumns = [
            { header: 'Task Title', key: 'title' },
            { header: 'Project', key: 'project' },
            { header: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
            { header: 'Action', key: 'action', render: (row) => (
                <select 
                    value={row.status} 
                    onChange={(e) => handleStatusUpdate(row.id, e.target.value)}
                    className="p-1 border rounded"
                >
                    <option value="ToDo">To Do</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Done">Done</option>
                </select>
            )}
        ];
        return (
            <Card title="📝 My Assigned Tasks">
                {isLoading ? (
                    <p>Loading your tasks...</p>
                ) : (
                    <DataTable 
                        columns={taskColumns} 
                        data={tasks}
                        showActions={false} // Actions handled by custom render
                    />
                )}
            </Card>
        );
    }
    
    return <div>User Welcome Page</div>;
};

// --- Main Dashboard Component ---
const DashboardContent = () => {
    const router = useRouter();
    const { user } = useAuth();
    
    const role = user?.role;
    const view = router.query.view || 'dashboard'; // Default view if none specified

    const availableViews = RoleViews[role] || [];
    
    let content;
    
    if (role === 'Admin') {
        content = <AdminDashboard view={view} />;
    } else if (role === 'Manager') {
        content = <ManagerDashboard view={view} />;
    } else if (role === 'User') {
        content = <UserDashboard view={view} />;
    } else {
        content = <Card title="Access Denied">You do not have a recognized role.</Card>;
    }

    return (
        <Layout views={availableViews}>
            {content}
        </Layout>
    );
};

export default withAuth(DashboardContent);