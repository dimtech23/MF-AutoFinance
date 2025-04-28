// import React, { useState, useEffect, useContext } from "react";
// import { UserContext } from "../../Context/UserContext.js";
// import Header from "components/Headers/Header.js";
// import { toast } from "react-toastify";
// import { format } from "date-fns";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import Select from "react-select";
// import { 
//   DollarSign, 
//   Plus, 
//   Filter, 
//   Download, 
//   Edit, 
//   Check,
//   X,
//   Search,
//   Calendar,
//   FileText,
//   Clock,
//   RefreshCw,
//   Info,
//   User
// } from "react-feather";
// import {
//   Container,
//   Typography,
//   Box,
//   Grid,
//   CircularProgress,
//   Alert,
//   Card,
//   CardHeader,
//   CardContent,
//   Button,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Chip,
//   TextField,
//   InputAdornment,
//   IconButton,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogContentText,
//   DialogTitle,
//   FormControl,
//   InputLabel,
//   MenuItem,
//   Select as MUISelect,
//   Divider,
//   Tooltip,
//   Avatar,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemAvatar,
//   Badge,
//   Tabs,
//   Tab
// } from "@mui/material";
// import axios from "axios";

// const baseURL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// // Car garage specific categories
// const expenseCategories = [
//   { value: "parts", label: "Auto Parts" },
//   { value: "shop_supplies", label: "Shop Supplies" },
//   { value: "tools", label: "Tools & Equipment" },
//   { value: "utilities", label: "Utilities" },
//   { value: "rent", label: "Rent/Mortgage" },
//   { value: "insurance", label: "Garage Insurance" },
//   { value: "salaries", label: "Mechanic Wages" },
//   { value: "marketing", label: "Marketing" },
//   { value: "training", label: "Training & Certifications" },
//   { value: "towing", label: "Towing Services" },
//   { value: "software", label: "Diagnostic Software" },
//   { value: "other", label: "Other Expenses" },
// ];

// const incomeCategories = [
//   { value: "repairs", label: "Repair Services" },
//   { value: "maintenance", label: "Maintenance Services" },
//   { value: "diagnostics", label: "Diagnostics" },
//   { value: "parts_sales", label: "Parts Sales" },
//   { value: "inspection", label: "Vehicle Inspections" },
//   { value: "bodywork", label: "Body Work" },
//   { value: "tires", label: "Tire Services" },
//   { value: "towing", label: "Towing Services" },
//   { value: "detailing", label: "Auto Detailing" },
//   { value: "other", label: "Other Income" },
// ];

// // Transaction status options
// const transactionStatusOptions = [
//   { value: "pending", label: "Pending Approval" },
//   { value: "approved", label: "Approved" },
//   { value: "rejected", label: "Rejected" },
// ];

// const MyTransactions = () => {
//   const { token, userName } = useContext(UserContext);
//   const [transactions, setTransactions] = useState([]);
//   const [filteredTransactions, setFilteredTransactions] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterType, setFilterType] = useState("all");
//   const [dateRange, setDateRange] = useState([null, null]);
//   const [startDate, endDate] = dateRange;
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [statusFilter, setStatusFilter] = useState(null);
  
//   // Form state
//   const [formOpen, setFormOpen] = useState(false);
//   const [editMode, setEditMode] = useState(false);
//   const [selectedTransaction, setSelectedTransaction] = useState(null);
//   const [formData, setFormData] = useState({
//     transactionDate: new Date(),
//     type: "expense",
//     amount: "",
//     category: null,
//     description: "",
//     reference: "",
//     notes: "",
//     attachments: [],
//     status: "pending"
//   });
  
//   // Detail dialog
//   const [detailOpen, setDetailOpen] = useState(false);
  
//   // Tab state
//   const [activeTab, setActiveTab] = useState('all');
  
//   // Pending approvals count
//   const [pendingCount, setPendingCount] = useState(0);

//   // Generate sample data (remove for production)
//   useEffect(() => {
//     const generateSampleData = () => {
//       const mockTransactions = Array(40).fill().map((_, index) => {
//         const isIncome = Math.random() > 0.6; // More expenses than income for accountant
//         const category = isIncome ? 
//           incomeCategories[Math.floor(Math.random() * incomeCategories.length)].value : 
//           expenseCategories[Math.floor(Math.random() * expenseCategories.length)].value;
          
//         // Generate statuses with appropriate distribution
//         let status;
//         const rand = Math.random();
//         if (rand < 0.2) {
//           status = "pending";
//         } else if (rand < 0.9) {
//           status = "approved";
//         } else {
//           status = "rejected";
//         }
        
//         let description = "";
//         if (isIncome) {
//           description = `${incomeCategories.find(c => c.value === category)?.label} transaction #${index + 1}`;
//         } else {
//           description = `${expenseCategories.find(c => c.value === category)?.label} expense #${index + 1}`;
//         }
        
//         return {
//           id: index + 1,
//           date: new Date(2025, 3, Math.floor(Math.random() * 30) + 1), // Random day in April 2025
//           type: isIncome ? "income" : "expense",
//           amount: parseFloat((Math.random() * (isIncome ? 1200 : 800) + 50).toFixed(2)),
//           category: category,
//           description: description,
//           reference: `REF-${Math.floor(Math.random() * 10000)}`,
//           notes: Math.random() > 0.7 ? "Additional notes for this transaction." : "",
//           createdBy: "Michael Accountant", // Current user 
//           status: status,
//           approvedBy: status === "approved" ? "John Manager" : null,
//           approvedAt: status === "approved" ? new Date(2025, 3, Math.floor(Math.random() * 30) + 1) : null,
//           rejectionReason: status === "rejected" ? "Invoice documentation incomplete" : null,
//           attachments: Math.random() > 0.5 ? [`receipt-${index + 1}.pdf`] : [],
//           createdAt: new Date(),
//         };
//       });
      
//       setTransactions(mockTransactions);
//       setFilteredTransactions(mockTransactions);
      
//       // Count pending transactions
//       const pending = mockTransactions.filter(t => t.status === "pending").length;
//       setPendingCount(pending);
//     };

//     // Simulate loading data from API
//     setIsLoading(true);
//     setTimeout(() => {
//       generateSampleData();
//       setIsLoading(false);
//     }, 800);

//     // In production, you would use the following code instead:
//     /*
//     const fetchTransactions = async () => {
//       setIsLoading(true);
//       try {
//         const response = await axios.get(`${baseURL}/my-transactions`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setTransactions(response.data);
//         setFilteredTransactions(response.data);
        
//         // Count pending transactions
//         const pending = response.data.filter(t => t.status === "pending").length;
//         setPendingCount(pending);
//       } catch (error) {
//         console.error("Error fetching transactions:", error);
//         toast.error("Failed to load transactions");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     if (token) {
//       fetchTransactions();
//     }
//     */
//   }, []);

//   // Apply filters when search term, filter type, date range, category, or status changes
//   useEffect(() => {
//     let result = [...transactions];
    
//     // Filter by type
//     if (filterType !== "all") {
//       result = result.filter(t => t.type === filterType);
//     }
    
//     // Filter by status
//     if (statusFilter) {
//       result = result.filter(t => t.status === statusFilter.value);
//     }
    
//     // Filter by search term
//     if (searchTerm) {
//       const term = searchTerm.toLowerCase();
//       result = result.filter(t => 
//         t.description.toLowerCase().includes(term) || 
//         t.category.toLowerCase().includes(term) || 
//         t.reference.toLowerCase().includes(term)
//       );
//     }
    
//     // Filter by date range
//     if (startDate && endDate) {
//       result = result.filter(t => {
//         const txDate = new Date(t.date);
//         return txDate >= startDate && txDate <= endDate;
//       });
//     }
    
//     // Filter by category
//     if (selectedCategory) {
//       result = result.filter(t => t.category === selectedCategory.value);
//     }
    
//     // Update filtered transactions
//     setFilteredTransactions(result);
// }, [transactions, searchTerm, filterType, startDate, endDate, selectedCategory, statusFilter]);

// const handleTabChange = (event, newValue) => {
//   setActiveTab(newValue);
  
//   // Set filters based on tab
//   if (newValue === 'all') {
//     setFilterType('all');
//     setStatusFilter(null);
//   } else if (newValue === 'income') {
//     setFilterType('income');
//     setStatusFilter(null);
//   } else if (newValue === 'expense') {
//     setFilterType('expense');
//     setStatusFilter(null);
//   } else if (newValue === 'pending') {
//     setFilterType('all');
//     setStatusFilter({ value: 'pending', label: 'Pending Approval' });
//   } else if (newValue === 'approved') {
//     setFilterType('all');
//     setStatusFilter({ value: 'approved', label: 'Approved' });
//   } else if (newValue === 'rejected') {
//     setFilterType('all');
//     setStatusFilter({ value: 'rejected', label: 'Rejected' });
//   }
// };

// const openTransactionForm = (transaction = null) => {
//   if (transaction) {
//     // Edit mode
//     setEditMode(true);
//     setSelectedTransaction(transaction);
//     setFormData({
//       transactionDate: new Date(transaction.date),
//       type: transaction.type,
//       amount: transaction.amount.toString(),
//       category: { 
//         value: transaction.category, 
//         label: transaction.type === 'income' 
//           ? incomeCategories.find(c => c.value === transaction.category)?.label 
//           : expenseCategories.find(c => c.value === transaction.category)?.label 
//       },
//       description: transaction.description,
//       reference: transaction.reference,
//       notes: transaction.notes || "",
//       attachments: transaction.attachments || [],
//       status: transaction.status
//     });
//   } else {
//     // Add mode
//     setEditMode(false);
//     setSelectedTransaction(null);
//     setFormData({
//       transactionDate: new Date(),
//       type: "expense",
//       amount: "",
//       category: null,
//       description: "",
//       reference: "",
//       notes: "",
//       attachments: [],
//       status: "pending"
//     });
//   }
//   setFormOpen(true);
// };

// const closeTransactionForm = () => {
//   setFormOpen(false);
// };

// const handleFormChange = (field, value) => {
//   if (field.includes('.')) {
//     const [parentField, childField] = field.split('.');
//     setFormData(prev => ({
//       ...prev,
//       [parentField]: {
//         ...prev[parentField],
//         [childField]: value
//       }
//     }));
//   } else {
//     setFormData(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   }

//   // Reset category when changing transaction type
//   if (field === 'type') {
//     setFormData(prev => ({
//       ...prev,
//       category: null
//     }));
//   }
// };

// const handleFileUpload = (event) => {
//   // In a real app, this would handle file uploads
//   // For this example, we'll just store the file names
//   const files = Array.from(event.target.files).map(file => file.name);
//   setFormData(prev => ({
//     ...prev,
//     attachments: [...prev.attachments, ...files]
//   }));
// };

// const removeAttachment = (index) => {
//   setFormData(prev => ({
//     ...prev,
//     attachments: prev.attachments.filter((_, i) => i !== index)
//   }));
// };

// const handleSubmitTransaction = () => {
//   // Validate form
//   if (!formData.transactionDate || 
//       !formData.amount || 
//       !formData.category || 
//       !formData.description) {
//     toast.error("Please fill all required fields");
//     return;
//   }

//   // Create new transaction object
//   const transactionData = {
//     date: formData.transactionDate,
//     type: formData.type,
//     amount: parseFloat(formData.amount),
//     category: formData.category.value,
//     description: formData.description,
//     reference: formData.reference,
//     notes: formData.notes,
//     attachments: formData.attachments,
//     status: "pending",
//     createdBy: "Michael Accountant", // Current user
//     createdAt: new Date()
//   };

//   if (editMode && selectedTransaction) {
//     // Update existing transaction
//     const updatedTransactions = transactions.map(t => 
//       t.id === selectedTransaction.id ? { 
//         ...transactionData, 
//         id: t.id,
//         status: selectedTransaction.status === "approved" || selectedTransaction.status === "rejected" 
//           ? selectedTransaction.status // Maintain status for approved/rejected
//           : "pending", // Reset to pending for edited transactions
//         approvedBy: selectedTransaction.status === "approved" ? selectedTransaction.approvedBy : null,
//         approvedAt: selectedTransaction.status === "approved" ? selectedTransaction.approvedAt : null,
//         rejectionReason: selectedTransaction.status === "rejected" ? selectedTransaction.rejectionReason : null
//       } : t
//     );
//     setTransactions(updatedTransactions);
//     toast.success("Transaction updated successfully");
//   } else {
//     // Add new transaction
//     const newId = Math.max(...transactions.map(t => t.id), 0) + 1;
//     const newTransaction = {
//       ...transactionData,
//       id: newId
//     };
//     setTransactions([newTransaction, ...transactions]);
//     toast.success("Transaction submitted for approval");
    
//     // Update pending count
//     setPendingCount(prev => prev + 1);
//   }

//   // Close the form
//   closeTransactionForm();

//   // In production, you would use the following code instead:
//   /*
//   const saveTransaction = async () => {
//     try {
//       let response;
//       if (editMode && selectedTransaction) {
//         response = await axios.put(
//           `${baseURL}/my-transactions/${selectedTransaction.id}`,
//           transactionData,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
        
//         // Update local state
//         const updatedTransactions = transactions.map(t => 
//           t.id === selectedTransaction.id ? response.data : t
//         );
//         setTransactions(updatedTransactions);
//         toast.success("Transaction updated successfully");
//       } else {
//         response = await axios.post(
//           `${baseURL}/my-transactions`,
//           transactionData,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
        
//         // Update local state
//         setTransactions([response.data, ...transactions]);
//         toast.success("Transaction submitted for approval");
        
//         // Update pending count
//         setPendingCount(prev => prev + 1);
//       }
      
//       // Close the form
//       closeTransactionForm();
//     } catch (error) {
//       console.error("Error saving transaction:", error);
//       toast.error("Failed to save transaction");
//     }
//   };
  
//   saveTransaction();
//   */
// };

// const openTransactionDetails = (transaction) => {
//   setSelectedTransaction(transaction);
//   setDetailOpen(true);
// };

// const closeTransactionDetails = () => {
//   setDetailOpen(false);
// };

// const exportToCSV = () => {
//   const headers = ["ID", "Date", "Type", "Category", "Description", "Amount", "Status", "Reference"];
//   const csvData = filteredTransactions.map(t => [
//     t.id,
//     format(new Date(t.date), "yyyy-MM-dd"),
//     t.type,
//     t.category,
//     t.description,
//     t.amount.toFixed(2),
//     t.status,
//     t.reference
//   ]);
  
//   // Create CSV content
//   const csvContent = [
//     headers.join(','),
//     ...csvData.map(row => row.join(','))
//   ].join('\n');
  
//   // Create download link
//   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//   const url = URL.createObjectURL(blob);
//   const link = document.createElement('a');
//   link.href = url;
//   link.setAttribute('download', `my_transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
// };

// const formatCurrency = (amount) => {
//   return new Intl.NumberFormat('en-US', {
//     style: 'currency',
//     currency: 'USD',
//     minimumFractionDigits: 2
//   }).format(amount);
// };

// const getTransactionTypeColor = (type) => {
//   return type === 'income' ? 'success' : 'error';
// };

// const getCategoryLabel = (type, categoryValue) => {
//   if (type === 'income') {
//     return incomeCategories.find(c => c.value === categoryValue)?.label || categoryValue;
//   } else {
//     return expenseCategories.find(c => c.value === categoryValue)?.label || categoryValue;
//   }
// };

// const getStatusColor = (status) => {
//   switch (status) {
//     case "approved": return "success";
//     case "pending": return "warning";
//     case "rejected": return "error";
//     default: return "default";
//   }
// };

// const getStatusIcon = (status) => {
//   switch (status) {
//     case "approved": return <Check size={16} />;
//     case "pending": return <Clock size={16} />;
//     case "rejected": return <X size={16} />;
//     default: return null;
//   }
// };

// if (isLoading) {
//   return (
//     <>
//       <Header />
//       <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
//         <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
//           <CircularProgress />
//         </Box>
//       </Container>
//     </>
//   );
// }

// return (
//   <>
//     <Header />
//     <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
//       <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//           <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
//             <User size={24} />
//           </Avatar>
//           <Typography variant="h4" component="h1">
//             My Transactions
//           </Typography>
//         </Box>
//         <Button 
//           variant="contained" 
//           color="primary" 
//           startIcon={<Plus />}
//           onClick={() => openTransactionForm()}
//         >
//           Add Transaction
//         </Button>
//       </Box>

//       {/* Welcome and status cards */}
//       <Grid container spacing={3} sx={{ mb: 4 }}>
//         <Grid item xs={12} md={8}>
//           <Card>
//             <CardContent>
//               <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                 <Typography variant="h6">Welcome back, {userName || "Michael Accountant"}</Typography>
//               </Box>
//               <Typography variant="body2" color="text.secondary">
//                 Track and manage your transactions. Any new transactions you add will need to be approved by a manager.
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//         <Grid item xs={12} md={4}>
//           <Card sx={{ bgcolor: pendingCount > 0 ? 'warning.light' : 'success.light' }}>
//             <CardContent>
//               <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                 <Badge badgeContent={pendingCount} color="warning" sx={{ mr: 1 }}>
//                   <Clock size={24} color={pendingCount > 0 ? "#ed6c02" : "#2e7d32"} />
//                 </Badge>
//                 <Typography variant="h6" color={pendingCount > 0 ? "warning.dark" : "success.dark"}>
//                   Approval Status
//                 </Typography>
//               </Box>
//               <Typography variant="body2" color={pendingCount > 0 ? "warning.dark" : "success.dark"}>
//                 {pendingCount > 0 
//                   ? `You have ${pendingCount} transaction${pendingCount === 1 ? '' : 's'} pending approval` 
//                   : "All your transactions have been processed"}
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       {/* Filters */}
//       <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
//         <Grid container spacing={2} alignItems="center">
//           <Grid item xs={12} md={3}>
//             <TextField
//               fullWidth
//               placeholder="Search transactions..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <Search size={20} />
//                   </InputAdornment>
//                 ),
//               }}
//               size="small"
//               variant="outlined"
//             />
//           </Grid>
//           <Grid item xs={12} md={3}>
//             <DatePicker
//               selectsRange={true}
//               startDate={startDate}
//               endDate={endDate}
//               onChange={(update) => setDateRange(update)}
//               placeholderText="Select date range"
//               customInput={
//                 <TextField 
//                   fullWidth 
//                   size="small"
//                   variant="outlined"
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <Calendar size={20} />
//                       </InputAdornment>
//                     ),
//                   }}
//                 />
//               }
//             />
//           </Grid>
//           <Grid item xs={12} md={3}>
//             <Select
//               placeholder="Filter by category"
//               isClearable
//               value={selectedCategory}
//               onChange={(option) => setSelectedCategory(option)}
//               options={[
//                 { label: 'Income Categories', options: incomeCategories },
//                 { label: 'Expense Categories', options: expenseCategories }
//               ]}
//             />
//           </Grid>
//           <Grid item xs={12} md={3}>
//             <Box sx={{ display: 'flex', gap: 1 }}>
//               <Button 
//                 variant="outlined" 
//                 startIcon={<Filter />}
//                 onClick={() => {
//                   setSearchTerm('');
//                   setDateRange([null, null]);
//                   setSelectedCategory(null);
//                   setFilterType('all');
//                   setStatusFilter(null);
//                   setActiveTab('all');
//                 }}
//               >
//                 Reset
//               </Button>
//               <Button 
//                 variant="outlined" 
//                 startIcon={<Download />}
//                 onClick={exportToCSV}
//               >
//                 Export
//               </Button>
//             </Box>
//           </Grid>
//         </Grid>
//       </Paper>

//       {/* Tabs */}
//       <Box sx={{ mb: 3 }}>
//         <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
//           <Tabs 
//             value={activeTab} 
//             onChange={handleTabChange}
//             aria-label="transaction tabs"
//           >
//             <Tab label="All Transactions" value="all" />
//             <Tab label="Income" value="income" />
//             <Tab label="Expenses" value="expense" />
//             <Tab 
//               label={
//                 <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                   Pending
//                   {pendingCount > 0 && (
//                     <Badge badgeContent={pendingCount} color="warning" sx={{ ml: 1 }} />
//                   )}
//                 </Box>
//               } 
//               value="pending" 
//             />
//             <Tab label="Approved" value="approved" />
//             <Tab label="Rejected" value="rejected" />
//           </Tabs>
//         </Box>
        
//         <Box sx={{ pt: 2 }}>
//           <MyTransactionsTable 
//             transactions={filteredTransactions}
//             onView={openTransactionDetails}
//             onEdit={openTransactionForm}
//             formatCurrency={formatCurrency}
//             getTransactionTypeColor={getTransactionTypeColor}
//             getCategoryLabel={getCategoryLabel}
//             getStatusColor={getStatusColor}
//             getStatusIcon={getStatusIcon}
//           />
//         </Box>
//       </Box>

//       {/* Transaction Form Dialog */}
//       <Dialog 
//         open={formOpen} 
//         onClose={closeTransactionForm}
//         maxWidth="md"
//         fullWidth
//       >
//         <DialogTitle>
//           {editMode ? 'Edit Transaction' : 'Add New Transaction'}
//         </DialogTitle>
//         <DialogContent>
//           <Grid container spacing={2} sx={{ mt: 1 }}>
//             <Grid item xs={12}>
//               <FormControl component="fieldset">
//                 <FormLabel component="legend">Transaction Type</FormLabel>
//                 <Tabs 
//                   value={formData.type} 
//                   onChange={(e, newValue) => handleFormChange('type', newValue)}
//                   aria-label="transaction type tabs"
//                 >
//                   <Tab label="Expense" value="expense" />
//                   <Tab label="Income" value="income" />
//                 </Tabs>
//               </FormControl>
//             </Grid>
            
//             <Grid item xs={12} md={6}>
//               <DatePicker
//                 selected={formData.transactionDate}
//                 onChange={(date) => handleFormChange('transactionDate', date)}
//                 dateFormat="MMMM d, yyyy"
//                 customInput={
//                   <TextField 
//                     label="Date" 
//                     fullWidth
//                     required
//                   />
//                 }
//               />
//             </Grid>
            
//             <Grid item xs={12} md={6}>
//               <TextField
//                 label="Amount"
//                 fullWidth
//                 required
//                 value={formData.amount}
//                 onChange={(e) => handleFormChange('amount', e.target.value)}
//                 type="number"
//                 InputProps={{
//                   startAdornment: <InputAdornment position="start">$</InputAdornment>,
//                 }}
//               />
//             </Grid>
            
//             <Grid item xs={12} md={6}>
//               <FormControl fullWidth required>
//                 <Typography variant="body2" color="textSecondary" gutterBottom>
//                   Category
//                 </Typography>
//                 <Select
//                   placeholder="Select category"
//                   value={formData.category}
//                   onChange={(option) => handleFormChange('category', option)}
//                   options={formData.type === 'income' ? incomeCategories : expenseCategories}
//                   className="basic-single"
//                   classNamePrefix="select"
//                 />
//               </FormControl>
//             </Grid>
            
//             <Grid item xs={12} md={6}>
//               <TextField
//                 label="Reference/Invoice Number"
//                 fullWidth
//                 value={formData.reference}
//                 onChange={(e) => handleFormChange('reference', e.target.value)}
//                 placeholder="Invoice number, receipt number, etc."
//               />
//             </Grid>
            
//             <Grid item xs={12}>
//               <TextField
//                 label="Description"
//                 fullWidth
//                 required
//                 multiline
//                 rows={2}
//                 value={formData.description}
//                 onChange={(e) => handleFormChange('description', e.target.value)}
//               />
//             </Grid>
            
//             <Grid item xs={12}>
//               <TextField
//                 label="Notes (Internal)"
//                 fullWidth
//                 multiline
//                 rows={2}
//                 value={formData.notes}
//                 onChange={(e) => handleFormChange('notes', e.target.value)}
//                 placeholder="Add any additional notes for this transaction"
//               />
//             </Grid>
            
//             <Grid item xs={12}>
//               <Typography variant="subtitle1" gutterBottom>
//                 Attachments
//               </Typography>
//               <Box sx={{ mb: 2 }}>
//                 <input
//                   accept="image/*, application/pdf"
//                   style={{ display: 'none' }}
//                   id="upload-attachment"
//                   type="file"
//                   multiple
//                   onChange={handleFileUpload}
//                 />
//                 <label htmlFor="upload-attachment">
//                   <Button 
//                     variant="outlined" 
//                     component="span"
//                   >
//                     Attach Files
//                   </Button>
//                 </label>
//                 <Typography variant="caption" sx={{ ml: 2 }}>
//                   Upload receipts, invoices, or other supporting documents
//                 </Typography>
//               </Box>
              
//               {formData.attachments.length > 0 && (
//                 <List dense>
//                   {formData.attachments.map((file, index) => (
//                     <ListItem 
//                       key={index}
//                       secondaryAction={
//                         <IconButton edge="end" aria-label="delete" onClick={() => removeAttachment(index)}>
//                           <X size={16} />
//                         </IconButton>
//                       }
//                     >
//                       <ListItemAvatar>
//                         <Avatar>
//                           <FileText size={16} />
//                         </Avatar>
//                       </ListItemAvatar>
//                       <ListItemText
//                         primary={file}
//                       />
//                     </ListItem>
//                   ))}
//                 </List>
//               )}
//             </Grid>
            
//             {editMode && (
//               <Grid item xs={12}>
//                 <Alert severity="info">
//                   <Typography variant="body2">
//                     Editing this transaction will reset its approval status to "Pending" and require re-approval.
//                   </Typography>
//                 </Alert>
//               </Grid>
//             )}
//           </Grid>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={closeTransactionForm}>Cancel</Button>
//           <Button 
//             onClick={handleSubmitTransaction} 
//             variant="contained" 
//             color="primary"
//           >
//             {editMode ? 'Update' : 'Submit for Approval'}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Transaction Detail Dialog */}
//       <Dialog 
//         open={detailOpen} 
//         onClose={closeTransactionDetails}
//         maxWidth="md"
//         fullWidth
//       >
//         {selectedTransaction && (
//           <>
//             <DialogTitle>
//               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                 <Typography variant="h6">
//                   Transaction Details
//                 </Typography>
//                 <Chip 
//                   icon={getStatusIcon(selectedTransaction.status)}
//                   label={selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)} 
//                   color={getStatusColor(selectedTransaction.status)}
//                 />
//               </Box>
//             </DialogTitle>
//             <DialogContent>
//               <Grid container spacing={2} sx={{ mt: 1 }}>
//                 <Grid item xs={12}>
//                   <Card sx={{ mb: 3 }}>
//                     <CardContent>
//                       <Grid container spacing={2}>
//                         <Grid item xs={12} md={6}>
//                           <Typography variant="body2" color="text.secondary">Transaction Type</Typography>
//                           <Typography variant="body1" gutterBottom>
//                             <Chip 
//                               label={selectedTransaction.type === 'income' ? 'Income' : 'Expense'} 
//                               color={getTransactionTypeColor(selectedTransaction.type)}
//                               size="small"
//                               sx={{ mt: 0.5 }}
//                             />
//                           </Typography>
//                         </Grid>
//                         <Grid item xs={12} md={6}>
//                           <Typography variant="body2" color="text.secondary">Amount</Typography>
//                           <Typography variant="body1" gutterBottom sx={{ 
//                             fontWeight: 'bold',
//                             color: selectedTransaction.type === 'income' ? 'success.main' : 'error.main' 
//                           }}>
//                             {formatCurrency(selectedTransaction.amount)}
//                           </Typography>
//                         </Grid>
//                         <Grid item xs={12} md={6}>
//                           <Typography variant="body2" color="text.secondary">Date</Typography>
//                           <Typography variant="body1" gutterBottom>
//                             {format(new Date(selectedTransaction.date), "MMMM d, yyyy")}
//                           </Typography>
//                         </Grid>
//                         <Grid item xs={12} md={6}>
//                           <Typography variant="body2" color="text.secondary">Category</Typography>
//                           <Typography variant="body1" gutterBottom>
//                             {getCategoryLabel(selectedTransaction.type, selectedTransaction.category)}
//                           </Typography>
//                         </Grid>
//                         <Grid item xs={12} md={6}>
//                           <Typography variant="body2" color="text.secondary">Reference/Invoice Number</Typography>
//                           <Typography variant="body1" gutterBottom>
//                             {selectedTransaction.reference || "N/A"}
//                           </Typography>
//                         </Grid>
//                         <Grid item xs={12} md={6}>
//                           <Typography variant="body2" color="text.secondary">Created By</Typography>
//                           <Typography variant="body1" gutterBottom>
//                             {selectedTransaction.createdBy}
//                           </Typography>
//                         </Grid>
//                         <Grid item xs={12}>
//                           <Typography variant="body2" color="text.secondary">Description</Typography>
//                           <Typography variant="body1" gutterBottom>
//                             {selectedTransaction.description}
//                           </Typography>
//                         </Grid>
//                         {selectedTransaction.notes && (
//                           <Grid item xs={12}>
//                             <Typography variant="body2" color="text.secondary">Notes</Typography>
//                             <Typography variant="body1" gutterBottom>
//                               {selectedTransaction.notes}
//                             </Typography>
//                           </Grid>
//                         )}
//                         {selectedTransaction.attachments && selectedTransaction.attachments.length > 0 && (
//                           <Grid item xs={12}>
//                             <Typography variant="body2" color="text.secondary">Attachments</Typography>
//                             <List dense>
//                               {selectedTransaction.attachments.map((file, index) => (
//                                 <ListItem key={index}>
//                                   <ListItemAvatar>
//                                     <Avatar>
//                                       <FileText size={16} />
//                                     </Avatar>
//                                   </ListItemAvatar>
//                                   <ListItemText
//                                     primary={file}
//                                   />
//                                 </ListItem>
//                               ))}
//                             </List>
//                           </Grid>
//                         )}
//                       </Grid>
//                     </CardContent>
//                   </Card>
                  
//                   {/* Approval information */}
//                   {selectedTransaction.status !== "pending" && (
//                     <Card>
//                       <CardHeader 
//                         title={selectedTransaction.status === "approved" ? "Approval Information" : "Rejection Information"} 
//                         sx={{ pb: 0 }}
//                       />
//                       <CardContent>
//                         <Grid container spacing={2}>
//                           {selectedTransaction.status === "approved" && (
//                             <>
//                               <Grid item xs={12} md={6}>
//                                 <Typography variant="body2" color="text.secondary">Approved By</Typography>
//                                 <Typography variant="body1" gutterBottom>
//                                   {selectedTransaction.approvedBy}
//                                 </Typography>
//                               </Grid>
//                               <Grid item xs={12} md={6}>
//                                 <Typography variant="body2" color="text.secondary">Approved On</Typography>
//                                 <Typography variant="body1" gutterBottom>
//                                   {selectedTransaction.approvedAt ? format(new Date(selectedTransaction.approvedAt), "MMMM d, yyyy") : "N/A"}
//                                 </Typography>
//                               </Grid>
//                             </>
//                           )}
//                           {selectedTransaction.status === "rejected" && (
//                             <Grid item xs={12}>
//                               <Typography variant="body2" color="text.secondary">Rejection Reason</Typography>
//                               <Typography variant="body1" gutterBottom>
//                                 {selectedTransaction.rejectionReason || "No reason provided"}
//                               </Typography>
//                             </Grid>
//                           )}
//                         </Grid>
//                       </CardContent>
//                     </Card>
//                   )}
//                 </Grid>
//               </Grid>
//             </DialogContent>
//             <DialogActions>
//               <Button onClick={closeTransactionDetails}>Close</Button>
//               {selectedTransaction.status === "pending" && (
//                 <Button 
//                   variant="contained"
//                   color="primary"
//                   startIcon={<Edit />}
//                   onClick={() => {
//                     closeTransactionDetails();
//                     openTransactionForm(selectedTransaction);
//                   }}
//                 >
//                   Edit
//                 </Button>
//               )}
//               {selectedTransaction.status === "rejected" && (
//                 <Button 
//                   variant="contained"
//                   color="primary"
//                   startIcon={<RefreshCw />}
//                   onClick={() => {
//                     closeTransactionDetails();
//                     openTransactionForm(selectedTransaction);
//                   }}
//                 >
//                   Revise & Resubmit
//                 </Button>
//               )}
//             </DialogActions>
//           </>
//         )}
//       </Dialog>
//     </Container>
//   </>
// );
// };

// // Separate table component
// const MyTransactionsTable = ({ 
// transactions, 
// onView,
// onEdit,
// formatCurrency,
// getTransactionTypeColor,
// getCategoryLabel,
// getStatusColor,
// getStatusIcon
// }) => {
// return (
//   <TableContainer component={Paper}>
//     <Table aria-label="my transactions table">
//       <TableHead>
//         <TableRow>
//           <TableCell>Date</TableCell>
//           <TableCell>Type</TableCell>
//           <TableCell>Category</TableCell>
//           <TableCell>Description</TableCell>
//           <TableCell align="right">Amount</TableCell>
//           <TableCell>Status</TableCell>
//           <TableCell>Reference</TableCell>
//           <TableCell align="center">Actions</TableCell>
//         </TableRow>
//       </TableHead>
//       <TableBody>
//         {transactions.length === 0 ? (
//           <TableRow>
//             <TableCell colSpan={8} align="center">
//               <Typography variant="body1" sx={{ py: 5 }}>
//                 No transactions found
//               </Typography>
//             </TableCell>
//           </TableRow>
//         ) : (
//           transactions.map((transaction) => (
//             <TableRow key={transaction.id}>
//               <TableCell>
//                 {format(new Date(transaction.date), "MMM d, yyyy")}
//               </TableCell>
//               <TableCell>
//                 <Chip 
//                   label={transaction.type === 'income' ? 'Income' : 'Expense'} 
//                   color={getTransactionTypeColor(transaction.type)}
//                   size="small"
//                 />
//               </TableCell>
//               <TableCell>{getCategoryLabel(transaction.type, transaction.category)}</TableCell>
//               <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: