import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from "@mui/material";
import { Add, Edit } from "@mui/icons-material";

const initialStaff = [
  { id: 1, name: "John Doe", baseSalary: 1000, overtimeHours: 5, overtimeRate: 20 },
  { id: 2, name: "Jane Smith", baseSalary: 1200, overtimeHours: 2, overtimeRate: 25 },
];

const StaffSalary = () => {
  const [staffList, setStaffList] = useState(initialStaff);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({ name: "", baseSalary: "", overtimeHours: "", overtimeRate: "" });

  const handleOpenDialog = (index = null) => {
    setEditIndex(index);
    if (index !== null) {
      setForm(staffList[index]);
    } else {
      setForm({ name: "", baseSalary: "", overtimeHours: "", overtimeRate: "" });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditIndex(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    const newEntry = {
      ...form,
      baseSalary: Number(form.baseSalary),
      overtimeHours: Number(form.overtimeHours),
      overtimeRate: Number(form.overtimeRate),
      id: editIndex !== null ? staffList[editIndex].id : Date.now(),
    };
    if (editIndex !== null) {
      const updated = [...staffList];
      updated[editIndex] = newEntry;
      setStaffList(updated);
    } else {
      setStaffList([...staffList, newEntry]);
    }
    handleCloseDialog();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Staff Salary & Overtime
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Track staff base salary, overtime hours, and calculate total payments.
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add Staff Salary
          </Button>
        </CardContent>
      </Card>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Base Salary (D)</TableCell>
              <TableCell>Overtime Hours</TableCell>
              <TableCell>Overtime Rate (D/hr)</TableCell>
              <TableCell>Overtime Pay (D)</TableCell>
              <TableCell>Total Pay (D)</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staffList.map((staff, idx) => {
              const overtimePay = staff.overtimeHours * staff.overtimeRate;
              const totalPay = staff.baseSalary + overtimePay;
              return (
                <TableRow key={staff.id}>
                  <TableCell>{staff.name}</TableCell>
                  <TableCell>{staff.baseSalary}</TableCell>
                  <TableCell>{staff.overtimeHours}</TableCell>
                  <TableCell>{staff.overtimeRate}</TableCell>
                  <TableCell>{overtimePay}</TableCell>
                  <TableCell>{totalPay}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(idx)} size="small">
                      <Edit fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editIndex !== null ? "Edit Staff Salary" : "Add Staff Salary"}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Base Salary (D)"
            name="baseSalary"
            type="number"
            value={form.baseSalary}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Overtime Hours"
            name="overtimeHours"
            type="number"
            value={form.overtimeHours}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Overtime Rate (D/hr)"
            name="overtimeRate"
            type="number"
            value={form.overtimeRate}
            onChange={handleChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffSalary; 