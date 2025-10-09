import React from 'react';
import {
    LayoutDashboard,
    FolderOpen,
    FileText,
    LogOut,
    Sun,
    Moon
} from 'lucide-react';
import { toast } from 'react-toastify';
import { AuthProvider, useAuth } from './utils/auth';
import type { Project, Invoice, Payment, ProjectFormData, InvoiceFormData, ProjectStatus, InvoiceStatus, PaymentMethod } from './types';
import apiClient from './utils/api';
import {
    Modal,
    ConfirmationModal,
    Toast
} from './components/ui';
import {
    ProjectForm,
    InvoiceForm
} from './components/forms';
import {
    DashboardPage,
    ProjectsListPage,
    InvoicesListPage,
    ProjectDetailPage,
    LoginPage
} from './pages';




// App Content Component (uses auth context)
function AppContent() {
    const { isAuthenticated, logout, isLoading, login } = useAuth();
    const [currentView, setCurrentView] = React.useState<{ view: string; id?: string }>({
        view: 'dashboard'
    });
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [invoices, setInvoices] = React.useState<Invoice[]>([]);
    const [payments, setPayments] = React.useState<Payment[]>([]);
    const [dataLoading, setDataLoading] = React.useState(false);
    const [modal, setModal] = React.useState<{
        isOpen: boolean;
        content: React.ReactNode;
        title?: string;
        actions?: React.ReactNode;
    }>({
        isOpen: false,
        content: null,
        title: undefined,
        actions: undefined
    });
    const [confirmationModal, setConfirmationModal] = React.useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'warning';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger'
    });
    const [isSidebarOpen, _] = React.useState(false);

    // Initialize dark mode from localStorage
    const [isDarkMode, setIsDarkMode] = React.useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    // Load dark mode preference from localStorage on mount
    React.useEffect(() => {
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) {
            const isDark = JSON.parse(saved);
            setIsDarkMode(isDark);
        }
    }, []);

    // Handle dark mode changes and save to localStorage
    React.useEffect(() => {
        const root = window.document.documentElement;

        // Save to localStorage
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));

        // Handle dark class for Tailwind CSS
        if (isDarkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Handle background gradient
        const background = isDarkMode
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)';
        document.body.style.background = background;

        return () => {
            root.classList.remove('dark');
            document.body.style.background = '';
        };
    }, [isDarkMode]);

    // Fetch data from API when authenticated
    React.useEffect(() => {
        const fetchData = async () => {
            if (!isAuthenticated) return;

            try {
                setDataLoading(true);

                // Fetch projects, invoices, and payments from API
                const [projectsResponse, invoicesResponse, paymentsResponse] = await Promise.all([
                    apiClient.getProjects(),
                    apiClient.getInvoices(),
                    apiClient.getPayments()
                ]);

                if (projectsResponse.success && projectsResponse.data) {
                    // Transform API data to match frontend types
                    const transformedProjects = projectsResponse.data.map(p => ({
                        id: p._id,
                        name: p.name,
                        description: p.description,
                        total_amount: p.total_amount,
                        status: p.status as ProjectStatus,
                        start_date: p.start_date ? new Date(p.start_date).toISOString().split('T')[0] : '',
                        end_date: p.end_date ? new Date(p.end_date).toISOString().split('T')[0] : undefined,
                        client_name: p.client_name,
                        notes: p.notes || '',
                        created_at: p.createdAt,
                        user_id: p.user_id
                    }));
                    setProjects(transformedProjects);
                }

                if (invoicesResponse.success && invoicesResponse.data) {
                    // Transform API data to match frontend types
                    const transformedInvoices = invoicesResponse.data.map(i => ({
                        id: i._id,
                        project_id: i.project_id,
                        invoice_number: i.invoice_number,
                        amount: i.amount,
                        status: i.status as InvoiceStatus,
                        issue_date: i.issue_date ? new Date(i.issue_date).toISOString().split('T')[0] : '',
                        due_date: i.due_date ? new Date(i.due_date).toISOString().split('T')[0] : ''
                    }));
                    setInvoices(transformedInvoices);
                }

                if (paymentsResponse.success && paymentsResponse.data) {
                    // Transform API data to match frontend types
                    const transformedPayments = paymentsResponse.data.map(p => ({
                        id: p._id,
                        invoice_id: p.invoice_id,
                        project_id: p.project_id,
                        amount: p.amount,
                        payment_method: p.payment_method as PaymentMethod,
                        payment_date: p.payment_date ? new Date(p.payment_date).toISOString().split('T')[0] : ''
                    }));
                    setPayments(transformedPayments);
                }
            } catch (err: any) {
                const errorMessage = apiClient.handleError(err);
                toast.error(errorMessage);
                console.error('Error fetching data:', err);
            } finally {
                setDataLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated]);

    const navigateTo = (view: string, id?: string) => {
        setCurrentView({ view, id: id || undefined });
    };

    const handleLogin = async (email: string, password: string) => {
        try {
            await login({ email, password });
            navigateTo('dashboard');
            toast.success('Login successful!');
        } catch (error: any) {
            toast.error(error.message || 'Login failed');
            console.log('error', error);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigateTo('login');
            toast.success('Logged out successfully!');
        } catch (error: any) {
            toast.error('Logout failed');
        }
    };

    const openModal = (content: React.ReactNode, title?: string, actions?: React.ReactNode) => {
        setModal({ isOpen: true, content, title, actions });
    };

    const closeModal = () => {
        setModal({
            isOpen: false,
            content: null,
            title: undefined,
            actions: undefined
        });
    };

    const showConfirmation = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' = 'danger') => {
        setConfirmationModal({
            isOpen: true,
            title,
            message,
            onConfirm,
            type
        });
    };

    const closeConfirmation = () => {
        setConfirmationModal({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: () => { },
            type: 'danger'
        });
    };

    // CRUD Handlers with API integration
    const handleSaveProject = async (projectData: ProjectFormData) => {
        try {
            setDataLoading(true);

            // Map frontend status to backend status
            const statusMapping: Record<string, string> = {
                'active': 'active',
                'on_hold': 'on_hold',
                'completed': 'completed',
                'cancelled': 'cancelled',
                'draft': 'draft'
            };

            const projectPayload = {
                name: projectData.name,
                description: projectData.description,
                total_amount: parseFloat(String(projectData.total_amount)),
                status: statusMapping[projectData.status || 'active'] || 'active',
                start_date: projectData.start_date,
                end_date: projectData.end_date || undefined,
                client_name: projectData.client_name
            };

            let response;
            if ('id' in projectData) {
                // Update existing project
                response = await apiClient.updateProject(projectData.id as string, projectPayload as any);
                if (response.success && response.data) {
                    // Update local state
                    const updatedProject: Project = {
                        id: response.data._id,
                        name: response.data.name,
                        description: response.data.description,
                        total_amount: response.data.total_amount,
                        status: response.data.status as ProjectStatus,
                        start_date: response.data.start_date ? new Date(response.data.start_date).toISOString().split('T')[0] : '',
                        end_date: response.data.end_date ? new Date(response.data.end_date).toISOString().split('T')[0] : undefined,
                        client_name: response.data.client_name,
                        notes: response.data.notes || '',
                        created_at: response.data.createdAt,
                        user_id: response.data.user_id
                    };
                    setProjects(projects.map(p =>
                        p.id === projectData.id ? updatedProject : p
                    ));
                    toast.success('Project updated successfully!');
                }
            } else {
                // Create new project
                response = await apiClient.createProject(projectPayload as any);
                if (response.success && response.data) {
                    const newProject: Project = {
                        id: response.data._id,
                        name: response.data.name,
                        description: response.data.description,
                        total_amount: response.data.total_amount,
                        status: response.data.status as ProjectStatus,
                        start_date: response.data.start_date ? new Date(response.data.start_date).toISOString().split('T')[0] : '',
                        end_date: response.data.end_date ? new Date(response.data.end_date).toISOString().split('T')[0] : undefined,
                        client_name: response.data.client_name,
                        notes: response.data.notes || '',
                        created_at: response.data.createdAt,
                        user_id: response.data.user_id
                    };
                    setProjects([...projects, newProject]);
                    toast.success('Project created successfully!');
                }
            }

            if (!response?.success) {
                throw new Error(response?.error || 'Failed to save project');
            }

            closeModal();
        } catch (err: any) {
            const errorMessage = apiClient.handleError(err);
            toast.error(errorMessage);
            console.error('Error saving project:', err);
        } finally {
            setDataLoading(false);
        }
    };

    const handleProjectFormSubmit = async (projectData: ProjectFormData) => {
        await handleSaveProject(projectData);
    };


    const handleDeleteProject = async (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        showConfirmation(
            'Delete Project',
            `Are you sure you want to delete "${project?.name}"? This will also delete all associated invoices and payments. This action cannot be undone.`,
            async () => {
                try {
                    setDataLoading(true);

                    // Delete project from API
                    const response = await apiClient.deleteProject(projectId);
                    if (response.success) {
                        // Update local state
                        setProjects(projects.filter(p => p.id !== projectId));
                        setInvoices(invoices.filter(i => i.project_id !== projectId));
                        setPayments(payments.filter(p => p.project_id !== projectId));
                        navigateTo('projects');
                        toast.success('Project deleted successfully!');
                    } else {
                        throw new Error(response.error || 'Failed to delete project');
                    }
                } catch (err: any) {
                    const errorMessage = apiClient.handleError(err);
                    toast.error(errorMessage);
                    console.error('Error deleting project:', err);
                } finally {
                    setDataLoading(false);
                }
                closeConfirmation();
            }
        );
    };

    const handleDeleteInvoice = async (invoiceId: string) => {
        const invoice = invoices.find(i => i.id === invoiceId);
        showConfirmation(
            'Delete Invoice',
            `Are you sure you want to delete invoice "${invoice?.invoice_number}"? This action cannot be undone.`,
            async () => {
                try {
                    setDataLoading(true);
                    const response = await apiClient.deleteInvoice(invoiceId);
                    if (response.success) {
                        // Update local state
                        setInvoices(invoices.filter(i => i.id !== invoiceId));
                        toast.success('Invoice deleted successfully!');
                    } else {
                        toast.error(response.error || 'Failed to delete invoice');
                    }
                } catch (err: any) {
                    const errorMessage = apiClient.handleError(err);
                    toast.error(errorMessage);
                    console.error('Error deleting invoice:', err);
                } finally {
                    setDataLoading(false);
                }
                closeConfirmation();
            }
        );
    };

    const handleSaveInvoice = async (invoiceData: InvoiceFormData, invoiceId?: string) => {
        try {
            setDataLoading(true);

            const invoicePayload = {
                project_id: invoiceData.project_id,
                amount: parseFloat(String(invoiceData.amount)),
                status: invoiceData.status || 'draft',
                issue_date: new Date(invoiceData.issue_date).toISOString(),
                due_date: new Date(invoiceData.due_date).toISOString()
            };

            let response;
            if (invoiceId) {
                // Update existing invoice
                response = await apiClient.updateInvoice(invoiceId, invoicePayload as any);
                if (response.success && response.data) {
                    const updatedInvoice: Invoice = {
                        id: response.data._id,
                        project_id: response.data.project_id,
                        invoice_number: response.data.invoice_number,
                        amount: response.data.amount,
                        status: response.data.status as InvoiceStatus,
                        issue_date: response.data.issue_date ? new Date(response.data.issue_date).toISOString().split('T')[0] : '',
                        due_date: response.data.due_date ? new Date(response.data.due_date).toISOString().split('T')[0] : ''
                    };
                    setInvoices(invoices.map(i =>
                        i.id === invoiceId ? updatedInvoice : i
                    ));
                    toast.success('Invoice updated successfully!');
                }
            } else {
                // Create new invoice
                response = await apiClient.createInvoice(invoicePayload as any);
                if (response.success && response.data) {
                    const newInvoice: Invoice = {
                        id: response.data._id,
                        project_id: response.data.project_id,
                        invoice_number: response.data.invoice_number,
                        amount: response.data.amount,
                        status: response.data.status as InvoiceStatus,
                        issue_date: response.data.issue_date ? new Date(response.data.issue_date).toISOString().split('T')[0] : '',
                        due_date: response.data.due_date ? new Date(response.data.due_date).toISOString().split('T')[0] : ''
                    };
                    setInvoices([...invoices, newInvoice]);
                    toast.success('Invoice created successfully!');
                }
            }

            if (!response?.success) {
                throw new Error(response?.error || 'Failed to save invoice');
            }

            closeModal();
        } catch (err: any) {
            const errorMessage = apiClient.handleError(err);
            toast.error(errorMessage);
            console.error('Error saving invoice:', err);
        } finally {
            setDataLoading(false);
        }
    };


    // Modal Openers
    const openProjectForm = (project?: Project | null) => {
        openModal(
            <ProjectForm
                project={project}
                onSave={handleProjectFormSubmit}
                onCancel={closeModal}
            />,
            project ? 'Edit Project' : 'Create New Project',
            <>
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 font-semibold border border-slate-300 dark:border-slate-600 w-full sm:w-auto"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={() => {
                        // Trigger form submission programmatically
                        const form = document.querySelector('form') as HTMLFormElement;
                        if (form) form.requestSubmit();
                    }}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl transition-all duration-200 font-semibold w-full sm:w-auto"
                >
                    {project ? 'Update Project' : 'Create Project'}
                </button>
            </>
        );
    };

    const openInvoiceForm = (invoice?: Invoice | null, defaultProjectId?: string) => {
        const handleSave = (invoiceData: InvoiceFormData) => {
            handleSaveInvoice(invoiceData, invoice?.id);
        };

        openModal(
            <InvoiceForm
                invoice={invoice}
                projects={projects}
                defaultProjectId={defaultProjectId}
                onSave={handleSave}
                onCancel={closeModal}
            />,
            invoice ? 'Edit Invoice' : 'Create New Invoice',
            <>
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 font-semibold border border-slate-300 dark:border-slate-600 w-full sm:w-auto"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={() => {
                        // Trigger form submission programmatically
                        const form = document.querySelector('form') as HTMLFormElement;
                        if (form) form.requestSubmit();
                    }}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl transition-all duration-200 font-semibold w-full sm:w-auto"
                >
                    {invoice ? 'Update Invoice' : 'Create Invoice'}
                </button>
            </>
        );
    };


    const SidebarItem: React.FC<{
        view: string;
        icon: React.ReactNode;
        label: string;
        isOpen: boolean;
    }> = ({ view, icon }) => (
        <button
            onClick={() => navigateTo(view)}
            className={`relative flex items-center justify-center w-full h-14 rounded-xl transition-all duration-300 transform hover:scale-105 ${currentView.view === view
                ? (isDarkMode ? 'bg-slate-700/80 text-blue-400 shadow-lg border-2 border-blue-400/50' : 'bg-white/60 backdrop-blur-md text-blue-600 shadow-lg border-2 border-blue-200')
                : (isDarkMode ? 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100' : 'text-slate-600 hover:bg-white/40 hover:text-slate-800 hover:backdrop-blur-md')
                }`}
        >
            <div className="flex items-center justify-center">
                {icon}
            </div>
        </button>
    );

    const renderContent = () => {
        const { view, id } = currentView;

        if (isLoading || dataLoading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                </div>
            );
        }

        switch (view) {
            case 'login':
                return (
                    <LoginPage
                        onLogin={handleLogin}
                    />
                );
            case 'dashboard':
                if (!isAuthenticated) {
                    navigateTo('login');
                    return null;
                }
                return (
                    <DashboardPage
                        projects={projects}
                        payments={payments}
                        invoices={invoices}
                        onViewProject={(projectId) => navigateTo('projectDetail', projectId)}
                    />
                );
            case 'projects':
                if (!isAuthenticated) {
                    navigateTo('login');
                    return null;
                }
                return (
                    <ProjectsListPage
                        projects={projects}
                        onAddProject={() => openProjectForm()}
                        onViewProject={(projectId) => navigateTo('projectDetail', projectId)}
                    />
                );
            case 'invoices':
                if (!isAuthenticated) {
                    navigateTo('login');
                    return null;
                }
                return (
                    <InvoicesListPage
                        invoices={invoices}
                        projects={projects}
                        onAddInvoice={() => openInvoiceForm()}
                        onEditInvoice={(invoice) => openInvoiceForm(invoice)}
                        onDeleteInvoice={handleDeleteInvoice}
                    />
                );
            case 'projectDetail':
                if (!isAuthenticated) {
                    navigateTo('login');
                    return null;
                }
                const project = projects.find(p => p.id === id);
                if (!project) return <div>Project not found!</div>;

                const projectInvoices = invoices.filter(i => {
                    // Handle both string project_id and nested project object
                    if (typeof i.project_id === 'string') {
                        return i.project_id === id;
                    } else {
                        return i.project_id.id === id;
                    }
                });
                const projectPayments = payments.filter(p => p.project_id === id);
                

                return (
                    <ProjectDetailPage
                        project={project}
                        invoices={projectInvoices}
                        payments={projectPayments}
                        onEditProject={(p) => openProjectForm(p)}
                        onAddInvoice={(pid) => openInvoiceForm(null, pid)}
                        onDeleteProject={handleDeleteProject}
                        onEditInvoice={(invoice) => openInvoiceForm(invoice)}
                        onDeleteInvoice={handleDeleteInvoice}
                    />
                );
            default:
                if (isAuthenticated) {
                    return (
                        <DashboardPage
                            projects={projects}
                            payments={payments}
                            invoices={invoices}
                            onViewProject={(projectId) => navigateTo('projectDetail', projectId)}
                        />
                    );
                } else {
                    navigateTo('login');
                    return null;
                }
        }
    };


    return (
        <div className={`font-sans overflow-hidden ${isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 to-slate-200'}`}>
            {isAuthenticated ? (
                <div className="flex h-screen">
                    {/* Sidebar */}
                    <div className="relative flex-shrink-0 w-20">
                        <div className={`h-full ${isDarkMode ? 'bg-slate-800/90' : 'bg-white/80'} backdrop-blur-lg border-r ${isDarkMode ? 'border-slate-600/50' : 'border-slate-300/50'} shadow-lg flex flex-col`}>
                            {/* Header */}
                            <div className="p-6">
                                <div className="flex items-center justify-center">
                                    <div className="flex items-center justify-center">
                                        <img
                                            src="https://singaji.in/assest/SSS-Favicon-Design.png"
                                            alt="SSS"
                                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-lg border-2 border-white/20"
                                            onError={(e) => {
                                                // Fallback to initial if image fails to load
                                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iMTAiIGZpbGw9InVybCgjcGFpbnQwXzFfMSkiLz4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjAiIGZpbGw9InVybCgjcGFpbnQxXzFfMSkiLz4KPHBhdGggZD0iTTE2IDI0SDMyTTE2IDE2SDMyTTE2IDMySDMydjQiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwXzFfMSIgeDE9IjAiIHkxPSIwIiB4Mj0iNDgiIHkyPSI0OCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMzk4MUVEIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzA2QjZEMyIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV8xXzEiIHgxPSIwIiB5MT0iMCIgeDI9IjQ4IiB5Mj0iNDgiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzEwQjk4MSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwMzc5OEQiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4=';
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 px-4 pb-6 space-y-2">
                                <SidebarItem
                                    view="dashboard"
                                    icon={<LayoutDashboard className="h-6 w-6" />}
                                    label="Dashboard"
                                    isOpen={isSidebarOpen}
                                />
                                <SidebarItem
                                    view="projects"
                                    icon={<FolderOpen className="h-6 w-6" />}
                                    label="Projects"
                                    isOpen={isSidebarOpen}
                                />
                                <SidebarItem
                                    view="invoices"
                                    icon={<FileText className="h-6 w-6" />}
                                    label="Invoices"
                                    isOpen={isSidebarOpen}
                                />
                            </nav>

                            {/* Bottom Controls */}
                            <div className="p-4 space-y-2 border-t border-slate-200">
                                {/* Dark/Light Mode Toggle */}
                                <button
                                    onClick={() => {
                                        setIsDarkMode(!isDarkMode);
                                    }}
                                    className={`w-full flex items-center justify-center h-10 rounded-xl transition-all duration-300 hover:scale-105 ${isDarkMode
                                        ? 'bg-slate-700/50 text-slate-200 hover:bg-slate-600/50 border border-slate-600/30'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/50'
                                        }`}
                                >
                                    {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                </button>

                                {/* Logout Button */}
                                <button
                                    onClick={() => {
                                        toast.success('Logged out successfully!');
                                        handleLogout();
                                    }}
                                    className={`w-full flex items-center justify-center h-12 rounded-xl transition-all duration-300 hover:scale-105 ${isDarkMode
                                        ? 'bg-red-800/50 text-red-300 hover:bg-red-700/50 border border-red-600/30'
                                        : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200/50'
                                        }`}
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Content Area */}
                        <main className="flex-1 p-6 overflow-y-auto scrollbar-thin">
                            {renderContent()}
                        </main>
                    </div>
                </div>
            ) : (
                /* Login Page without sidebar */
                <div className="h-screen overflow-y-auto">
                    {renderContent()}
                </div>
            )}

            {/* Modals */}
            <Modal
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={modal.title}
                actions={modal.actions}
            >
                {modal.content}
            </Modal>

            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                title={confirmationModal.title}
                message={confirmationModal.message}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmationModal.onConfirm}
                onCancel={closeConfirmation}
                type={confirmationModal.type}
            />

            <Toast />
        </div>
    );
}

// Main App Component with AuthProvider
export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

