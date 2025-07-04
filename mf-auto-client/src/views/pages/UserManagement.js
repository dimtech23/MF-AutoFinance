import React, { useState, useEffect, useContext } from "react";
import { usersAPI } from "../../api.js";
import { UserContext } from "../../Context/UserContext.js";
import { toast } from "react-toastify";
import { 
  Edit, 
  Trash2, 
  Search,
  UserPlus,
  Lock,
  Users,
  EyeOff,
  Eye
} from "lucide-react";
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Switch,
  MenuItem,
  InputLabel,
  Select,
  Divider,
  Tooltip,
  Avatar
} from "@mui/material";
import { styled } from "@mui/material/styles";

// Role options
const ROLES = [
  { value: "Admin", label: "Admin" },
  { value: "Accountant", label: "Accountant" },
  { value: "Mechanic", label: "Mechanic" },
  { value: "Receptionist", label: "Receptionist" }
];

// User status options
const userStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" }
];

// Colors for role tags
const ROLE_COLORS = {
  "Admin": "error",
  "Accountant": "success",
  "Mechanic": "warning",
  "Receptionist": "info"
};

// Get avatar color based on role
const getAvatarColorByRole = (role) => {
  switch (role) {
    case "Admin": return "#f44336"; // Red
    case "Accountant": return "#4caf50"; // Green
    case "Mechanic": return "#ff9800"; // Orange
    case "Receptionist": return "#00bcd4"; // Cyan
    default: return "#9e9e9e"; // Grey
  }
};

// Generate initials from name
const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const UserAvatar = styled(Avatar)(({ theme, role }) => ({
  backgroundColor: getAvatarColorByRole(role),
  color: "#fff",
  width: theme.spacing(4),
  height: theme.spacing(4)
}));

const UserManagement = () => {
  const { token } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // User form state
  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Password reset dialog
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "Mechanic",
    status: "active",
    password: "",
    sendInvitation: true,
    permissions: {
      canManageUsers: false,
      canManageFinances: false,
      canViewReports: false,
      canManageInventory: false,
      canManageAppointments: false
    }
  });
  
  // Form validation
  const [formErrors, setFormErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });
  
  // Confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await usersAPI.getAll();
        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };
  
    if (token) {
      fetchUsers();
    }
  }, [token]);

  // Apply filters when search term, role filter, or status filter changes
  useEffect(() => {
    let result = [...users];
    
    // Filter by role
    if (roleFilter) {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // Filter by status
    if (statusFilter) {
      result = result.filter(user => user.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term) ||
        (user.phone && user.phone.toLowerCase().includes(term))
      );
    }
    
    // Update filtered users
    setFilteredUsers(result);
    setPage(0); // Reset to first page when filters change
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const openUserForm = (user = null) => {
    if (user) {
      // Edit mode
      setEditMode(true);
      setSelectedUser(user);
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        status: user.status,
        password: "",
        sendInvitation: false,
        permissions: { ...user.permissions }
      });
    } else {
      // Add mode
      setEditMode(false);
      setSelectedUser(null);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "Mechanic",
        status: "active",
        password: "",
        sendInvitation: true,
        permissions: {
          canManageUsers: false,
          canManageFinances: false,
          canViewReports: false,
          canManageInventory: false,
          canManageAppointments: false
        }
      });
    }
    setFormErrors({
      firstName: "",
      lastName: "",
      email: "",
      password: ""
    });
    setShowPassword(false);
    setFormOpen(true);
  };

  const closeUserForm = () => {
    setFormOpen(false);
  };

  const handleFormChange = (field, value) => {
    // Clear validation error when user types
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
    
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parentField]: {
          ...prev[parentField],
          [childField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Set default permissions based on role
    if (field === 'role') {
      let newPermissions = {
        canManageUsers: false,
        canManageFinances: false,
        canViewReports: false,
        canManageInventory: false,
        canManageAppointments: false
      };
      
      switch (value) {
        case "Admin":
          newPermissions = {
            canManageUsers: true,
            canManageFinances: true,
            canViewReports: true,
            canManageInventory: true,
            canManageAppointments: true
          };
          break;
        case "Accountant":
          newPermissions = {
            canManageUsers: false,
            canManageFinances: true,
            canViewReports: true,
            canManageInventory: false,
            canManageAppointments: false
          };
          break;
        case "Mechanic":
          newPermissions = {
            canManageUsers: false,
            canManageFinances: false,
            canViewReports: false,
            canManageInventory: false,
            canManageAppointments: false
          };
          break;
        case "Receptionist":
          newPermissions = {
            canManageUsers: false,
            canManageFinances: false,
            canViewReports: false,
            canManageInventory: false,
            canManageAppointments: true
          };
          break;
        default:
          break;
      }
      
      setFormData(prev => ({
        ...prev,
        permissions: newPermissions
      }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {
      firstName: "",
      lastName: "",
      email: "",
      password: ""
    };
    
    // Validate first name
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
      isValid = false;
    }
    
    // Validate last name
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
      isValid = false;
    }
    
    // Validate email
    if (!formData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
      isValid = false;
    }
    
    // Validate password (only for new users)
    if (!editMode && !formData.password.trim()) {
      errors.password = "Password is required for new users";
      isValid = false;
    } else if (!editMode && formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmitUser = async () => {
    // Validate form
    if (!validateForm()) {
      toast.error("Please correct the errors in the form");
      return;
    }
  
    // Create user object
    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      status: formData.status,
      permissions: formData.permissions
    };
  
    // Add password for new users
    if (!editMode) {
      userData.password = formData.password;
      userData.sendInvitation = formData.sendInvitation;
    }
  
    try {
      if (editMode && selectedUser) {
        // Update existing user
        const response = await usersAPI.update(selectedUser.id, userData);
        const updatedUsers = users.map(user => 
          user.id === selectedUser.id ? response.data : user
        );
        setUsers(updatedUsers);
        toast.success("User updated successfully");
      } else {
        // Add new user
        const response = await usersAPI.create(userData);
        setUsers([response.data, ...users]);
        
        if (formData.sendInvitation) {
          toast.info(`Invitation email sent to ${formData.email}`);
        }
        
        toast.success("User created successfully");
      }
  
      // Close the form
      closeUserForm();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error(error.response?.data?.message || "Failed to save user");
    }
  };

  const openDeleteConfirmation = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await usersAPI.delete(userToDelete.id);
      const updatedUsers = users.filter(user => user.id !== userToDelete.id);
      setUsers(updatedUsers);
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
      setDeleteDialogOpen(false);
    }
  };

  const openResetPasswordDialog = (user) => {
    setUserToResetPassword(user);
    setNewPassword("");
    setShowNewPassword(false);
    setResetPasswordOpen(true);
  };

  const handleResetPassword = async () => {
    if (!userToResetPassword || !newPassword) return;
    
    try {
      await usersAPI.resetPassword(userToResetPassword.id, newPassword);
      toast.success(`Password reset for ${userToResetPassword.email}`);
      setResetPasswordOpen(false);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Failed to reset password");
    }
  };

  
  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const formatDate = (date) => {
    if (!date) return "Never";
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(new Date(date));
  };

  const formatUserName = (firstName, lastName) => {
    return `${firstName} ${lastName}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "success";
      case "inactive": return "error";
      case "pending": return "warning";
      default: return "default";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Admin": return "#f44336"; // Red
      case "Accountant": return "#4caf50"; // Green
      case "Mechanic": return "#ff9800"; // Orange
      case "Receptionist": return "#00bcd4"; // Cyan
      default: return "#9e9e9e"; // Grey
    }
  };

  const getRolePermissions = (role) => {
    let permissions = {};
    
    switch (role) {
      case "Admin":
        permissions = {
          canManageUsers: true,
          canManageFinances: true,
          canViewReports: true,
          canManageInventory: true,
          canManageAppointments: true
        };
        break;
      case "Accountant":
        permissions = {
          canManageUsers: false,
          canManageFinances: true,
          canViewReports: true,
          canManageInventory: false,
          canManageAppointments: false
        };
        break;
      case "Mechanic":
        permissions = {
          canManageUsers: false,
          canManageFinances: false,
          canViewReports: false,
          canManageInventory: false,
          canManageAppointments: false
        };
        break;
      case "Receptionist":
        permissions = {
          canManageUsers: false,
          canManageFinances: false,
          canViewReports: false,
          canManageInventory: false,
          canManageAppointments: true
        };
        break;
      default:
        permissions = {
          canManageUsers: false,
          canManageFinances: false,
          canViewReports: false,
          canManageInventory: false,
          canManageAppointments: false
        };
    }
    
    return permissions;
  };

  if (isLoading) {
    return (
      <>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <Users size={24} />
            </Avatar>
            <Typography variant="h4" component="h1">
              User Management
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<UserPlus />}
            onClick={() => openUserForm()}
          >
            Add User
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} />
                    </InputAdornment>
                  ),
                }}
                size="small"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="role-filter-label">Filter by Role</InputLabel>
                <Select
                  labelId="role-filter-label"
                  value={roleFilter}
                  label="Filter by Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  {ROLES.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Filter by Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Filter by Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {userStatusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                fullWidth
                variant="outlined" 
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('');
                  setStatusFilter('');
                }}
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Users Table */}
        <Paper sx={{ width: '100%', mb: 2 }}>
          <TableContainer>
            <Table aria-label="users table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1" sx={{ py: 5 }}>
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <UserAvatar role={user.role}>
                              {getInitials(formatUserName(user.firstName, user.lastName))}
                            </UserAvatar>
                            <Box sx={{ ml: 2 }}>
                              <Typography variant="body1">
                                {formatUserName(user.firstName, user.lastName)}
                              </Typography>
                              {user.phone && (
                                <Typography variant="caption" color="text.secondary">
                                  {user.phone}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role} 
                            color={getRoleColor(user.role)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.status.charAt(0).toUpperCase() + user.status.slice(1)} 
                            color={getStatusColor(user.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(user.lastLogin)}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Tooltip title="Edit User">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => openUserForm(user)}
                              >
                                <Edit size={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reset Password">
                              <IconButton 
                                size="small" 
                                color="secondary"
                                onClick={() => openResetPasswordDialog(user)}
                              >
                                <Lock size={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete User">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => openDeleteConfirmation(user)}
                              >
                                <Trash2 size={18} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>

        {/* User Form Dialog */}
        <Dialog 
          open={formOpen} 
          onClose={closeUserForm}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editMode ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  required
                  value={formData.firstName}
                  onChange={(e) => handleFormChange('firstName', e.target.value)}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  required
                  value={formData.lastName}
                  onChange={(e) => handleFormChange('lastName', e.target.value)}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  fullWidth
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone (Optional)"
                  fullWidth
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    value={formData.role}
                    label="Role"
                    onChange={(e) => handleFormChange('role', e.target.value)}
                  >
                    {ROLES.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    value={formData.status}
                    label="Status"
                    onChange={(e) => handleFormChange('status', e.target.value)}
                  >
                    {userStatusOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {!editMode && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      label="Password"
                      fullWidth
                      required
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleFormChange('password', e.target.value)}
                      error={!!formErrors.password}
                      helperText={formErrors.password}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleFormChange('password', generateRandomPassword())}
                      >
                        Generate Random Password
                      </Button>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={formData.sendInvitation} 
                            onChange={(e) => handleFormChange('sendInvitation', e.target.checked)} 
                          />
                        }
                        label="Send invitation email"
                      />
                    </Box>
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  User Permissions
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={formData.permissions.canManageUsers} 
                      onChange={(e) => handleFormChange('permissions.canManageUsers', e.target.checked)} 
                      disabled={formData.role === "Admin"}
                    />
                  }
                  label="Can manage users"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={formData.permissions.canManageFinances} 
                      onChange={(e) => handleFormChange('permissions.canManageFinances', e.target.checked)} 
                      disabled={formData.role === "Admin"}
                    />
                  }
                  label="Can manage finances"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={formData.permissions.canViewReports} 
                      onChange={(e) => handleFormChange('permissions.canViewReports', e.target.checked)} 
                      disabled={formData.role === "Admin"}
                    />
                  }
                  label="Can view reports"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={formData.permissions.canManageInventory} 
                      onChange={(e) => handleFormChange('permissions.canManageInventory', e.target.checked)} 
                      disabled={formData.role === "Admin"}
                    />
                  }
                  label="Can manage inventory"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={formData.permissions.canManageAppointments} 
                      onChange={(e) => handleFormChange('permissions.canManageAppointments', e.target.checked)} 
                      disabled={formData.role === "Admin"}
                    />
                  }
                  label="Can manage appointments"
                />
              </Grid>
              
              {formData.role === "Admin" && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Admin users automatically have all permissions
                  </Alert>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeUserForm}>Cancel</Button>
            <Button 
              onClick={handleSubmitUser} 
              variant="contained" 
              color="primary"
            >
              {editMode ? 'Update' : 'Add User'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog 
          open={resetPasswordOpen} 
          onClose={() => setResetPasswordOpen(false)}
        >
          <DialogTitle>Reset Password</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Enter a new password for {userToResetPassword?.email}
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="New Password"
              type={showNewPassword ? "text" : "password"}
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setNewPassword(generateRandomPassword())}
              >
                Generate Random Password
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetPasswordOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleResetPassword} 
              variant="contained" 
              color="primary"
              disabled={!newPassword}
            >
              Reset Password
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the user {userToDelete ? formatUserName(userToDelete.firstName, userToDelete.lastName) : ''}? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteUser} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default UserManagement;