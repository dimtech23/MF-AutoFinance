import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import api from "../../api";
import { UserContext } from "Context/UserContext";
import Header from "components/Headers/Header";
import {
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Chip,
  Card,
  TablePagination,
  Grid,
  IconButton,
  TextField,
  InputAdornment,
  Backdrop,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Autocomplete,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import {
  Search,
  RefreshCcw,
  Eye,
  X,
  FileText,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Calendar,
  Mail,
  MapPin,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import ShipmentAgreementPDF from "../../components/ShipmentAgreementPDF";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

const baseURL =
  process.env.NODE_ENV === "production"
    ? "https://apps.mrc.gm/bioship"
    : "https://localhost:7097";

// Styled components
const SearchWrapper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[2],
  borderRadius: theme.shape.borderRadius,
}));

const SearchInputWrapper = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    "&.Mui-focused": {
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
      },
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.light,
    },
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${theme.breakpoints.down("sm")}`]: {
    display: "none",
  },
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  fontWeight: "bold",
  padding: theme.spacing(0.5, 1),
}));

const TableRowStyled = styled(TableRow)(({ theme }) => ({
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    transition: "background-color 0.2s ease",
  },
  cursor: "pointer",
}));

const HighlightedText = ({ text, searchTerm }) => {
  if (!searchTerm || searchTerm.trim() === "" || !text) {
    return <span>{text}</span>;
  }

  const term = searchTerm.trim();
  const parts = String(text).split(new RegExp(`(${term})`, "gi"));

  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <mark key={index} style={{ backgroundColor: "yellow", padding: 0 }}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

// Status configurations
const getStatusText = (statusId) => {
  switch (statusId) {
    case 1:
      return "Pending Review";
    case 2:
      return "Awaiting Agent";
    case 3:
      return "Awaiting Checklist";
    case 4:
      return "Shipped";
    default:
      return "Unknown";
  }
};

const getStatusColor = (statusId) => {
  switch (statusId) {
    case 1:
      return "warning";
    case 2:
      return "info";
    case 3:
      return "secondary";
    case 4:
      return "success";
    default:
      return "default";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Function to perform deep search within a request object
const deepSearchRequest = (request, searchTerm) => {
  if (!searchTerm || searchTerm.trim() === "") return true;

  const term = searchTerm.toLowerCase().trim();

  // Function to check if a value contains the search term
  const containsTerm = (value) => {
    if (value === null || value === undefined) return false;

    // Handle different value types
    if (typeof value === "string") return value.toLowerCase().includes(term);
    if (typeof value === "number") return value.toString().includes(term);
    if (typeof value === "boolean")
      return value.toString().toLowerCase().includes(term);

    // Handle date objects
    if (value instanceof Date) {
      return value.toLocaleString().toLowerCase().includes(term);
    }

    return false;
  };

  // Search in request fields
  const requestFields = [
    request.request.id?.toString(),
    request.request.fullName,
    request.request.staffEmail,
    request.request.projectName,
    request.request.chargeCode,
    request.request.sccLeo,
    request.request.projectPIMRCG,
    request.request.primaryAgent,
    request.request.awbNumber,
    request.request.consigneeName,
    request.request.consigneeEmail,
    request.request.address,
    request.request.country,
    request.request.tel,
    request.request.purpose,
    formatDate(request.request.createdDateTime),
    getStatusText(request.request.statusId),
  ];

  // Check request fields
  if (requestFields.some((field) => field && containsTerm(field))) return true;

  // Check shipment detail fields
  if (request.shipmentDetail) {
    const shipmentFields = [
      request.shipmentDetail.totalWeightKg?.toString(),
      request.shipmentDetail.agent,
      request.shipmentDetail.vatRegistration,
      request.shipmentDetail.eori,
      request.shipmentDetail.hsCode,
      request.shipmentDetail.incoterm,
      request.shipmentDetail.productDescription,
    ];

    if (shipmentFields.some((field) => field && containsTerm(field)))
      return true;

    // Check overpack summaries
    if (
      request.shipmentDetail.overpackSummaries &&
      request.shipmentDetail.overpackSummaries.length > 0
    ) {
      for (const summary of request.shipmentDetail.overpackSummaries) {
        const summaryFields = [
          summary.overpackType,
          summary.totalOverpacks?.toString(),
          summary.externalDimensions,
          summary.dryIceCapacity?.toString(),
          summary.dryIceUsed?.toString(),
        ];

        if (summaryFields.some((field) => field && containsTerm(field)))
          return true;
      }
    }
  }

  // Check sample descriptions
  if (
    request.request.sampleDescriptions &&
    request.request.sampleDescriptions.length > 0
  ) {
    for (const sample of request.request.sampleDescriptions) {
      const sampleFields = [
        sample.sampleType,
        sample.containerType,
        sample.boxID,
        sample.totalNumber?.toString(),
        sample.totalVolume?.toString(),
        sample.overpackType,
        sample.overpackID,
      ];

      if (sampleFields.some((field) => field && containsTerm(field)))
        return true;
    }
  }

  return false;
};

const ShipperRequests = () => {
  const { token, userRole } = useContext(UserContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState({});
  const [page, setPage] = useState(0);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [generatingPdfForId, setGeneratingPdfForId] = useState(null);

  // Advanced search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: {
      startDate: "",
      endDate: "",
    },
    agents: [],
  });
  const [availableAgents, setAvailableAgents] = useState([]);
  const [exportProgress, setExportProgress] = useState(false);

  const isAdmin = userRole === "Admin";

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let endpoint;
      if (isAdmin) {
        endpoint = "/api/Shipper/GetAllRequests";
      } else {
        endpoint = "/api/Shipper/GetShipperRequests";
      }

      const response = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseData = response.data || [];
      const formattedData = responseData.map((item) => ({
        request: item.request || item,
        shipmentDetail: item.shipmentDetail || null,
      }));

      setRequests(formattedData);

      // Extract unique agents for filter
      const allAgents = formattedData
        .map((req) => req.request.primaryAgent)
        .filter((agent) => agent && agent !== "N/A" && agent !== "Pending");

      setAvailableAgents([...new Set(allAgents)]);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtered data based on search term and filters
  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    // Apply deep search with search term
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((request) =>
        deepSearchRequest(request, searchTerm)
      );
    }

    // Apply status filter
    if (filters.status !== "all") {
      const statusId = parseInt(filters.status);
      filtered = filtered.filter(
        (request) => request.request.statusId === statusId
      );
    }

    // Apply date range filter
    if (filters.dateRange.startDate) {
      filtered = filtered.filter((request) => {
        const createdDate = new Date(request.request.createdDateTime);
        return createdDate >= new Date(filters.dateRange.startDate);
      });
    }

    if (filters.dateRange.endDate) {
      filtered = filtered.filter((request) => {
        const createdDate = new Date(request.request.createdDateTime);
        return createdDate <= new Date(filters.dateRange.endDate);
      });
    }

    // Apply agent filter
    if (filters.agents.length > 0) {
      filtered = filtered.filter((request) =>
        filters.agents.includes(request.request.primaryAgent)
      );
    }

    return filtered;
  }, [requests, searchTerm, filters]);

  // Add the pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    if (token) fetchRequests();
  }, [token]);

  const resetFilters = () => {
    setFilters({
      status: "all",
      dateRange: {
        startDate: "",
        endDate: "",
      },
      agents: [],
    });
    setSearchTerm("");
    setShowAdvancedSearch(false);
  };

  // Export to Excel
  const exportToExcel = useCallback(async () => {
    try {
      setExportProgress(true);

      // Prepare the data for export
      const exportData = filteredRequests.map((item) => {
        const request = item.request;
        const shipmentDetail = item.shipmentDetail || {};

        return {
          "Request ID": request.id,
          Requestor: request.fullName,
          Email: request.staffEmail,
          "Project Name": request.projectName,
          "Charge Code": request.chargeCode,
          "SCC/Leo": request.sccLeo,
          "Project PI": request.projectPIMRCG,
          Agent: request.primaryAgent || "N/A",
          "AWB Number": request.awbNumber || "N/A",
          Status: getStatusText(request.statusId),
          "Created Date": formatDate(request.createdDateTime),
          "Consignee Name": request.consigneeName || "N/A",
          "Consignee Email": request.consigneeEmail || "N/A",
          Country: request.country || "N/A",
          Address: request.address || "N/A",
          Tel: request.tel || "N/A",
          "Is Hazardous": request.isHazardous ? "Yes" : "No",
          "Has MTA": request.hasMTA ? "Yes" : "No",
          "Total Weight (kg)": shipmentDetail.totalWeightKg || "N/A",
          "VAT Registration": shipmentDetail.vatRegistration || "N/A",
          EORI: shipmentDetail.eori || "N/A",
          "HS Code": shipmentDetail.hsCode || "N/A",
          Incoterm: shipmentDetail.incoterm || "N/A",
        };
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Shipment Requests");

      // Generate Excel file
      XLSX.writeFile(workbook, "Shipment_Requests_Export.xlsx");

      toast.success("Export completed successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data. Please try again.");
    } finally {
      setExportProgress(false);
    }
  }, [filteredRequests]);

  const generatePDF = useCallback(async (request) => {
    try {
      // Set loading state only for this specific request
      setGeneratingPdfForId(request.request.id);

      // Split agents string and generate PDF for each agent
      const agents = request.shipmentDetail?.agent?.split(", ") || [];

      if (agents.length === 0) {
        toast.error("No agent information found for this request");
        setGeneratingPdfForId(null);
        return;
      }

      for (const agent of agents) {
        // Create a clean request object with all needed properties correctly formatted
        const requestData = {
          ...request.request,
          // Ensure consignee email is passed correctly and doesn't become "N/A"
          consigneeEmail: request.request.consigneeEmail || "",
        };

        const content = (
          <ShipmentAgreementPDF
            request={requestData}
            shipmentDetails={{ ...request.shipmentDetail, agent }}
          />
        );

        const blob = await pdf(content).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `shipment_invoice_${request.request.id}_${agent}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast.success(`${agents.length} Invoice PDF(s) downloaded successfully`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(
        `Failed to generate PDF: ${error.message}. Please try again.`
      );
    } finally {
      setGeneratingPdfForId(null);
    }
  }, []);

  if (loading) {
    return (
      <Backdrop open={true} style={{ color: "#fff", zIndex: 10 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Box sx={{ p: 3, bgcolor: "#f5f5f5", flexGrow: 1 }}>
        {/* Header Section */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "#333" }}>
            {isAdmin ? "All Shipment Requests" : "My Shipment History"}
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Download />}
              onClick={exportToExcel}
              disabled={exportProgress}
            >
              {exportProgress ? (
                <CircularProgress size={24} />
              ) : (
                "Export to Excel"
              )}
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshCcw size={20} />}
              onClick={fetchRequests}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Search and Filter Section */}
        <SearchWrapper>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <SearchInputWrapper
                fullWidth
                size="medium"
                placeholder="Search anything: ID, Project, Agent, AWB, Consignee, Email, Address, Status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        color="primary"
                        onClick={() =>
                          setShowAdvancedSearch(!showAdvancedSearch)
                        }
                        endIcon={
                          showAdvancedSearch ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )
                        }
                      >
                        Advanced
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Collapse in={showAdvancedSearch}>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.status}
                        label="Status"
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                      >
                        <MenuItem value="all">All Statuses</MenuItem>
                        <MenuItem value="1">Pending Review</MenuItem>
                        <MenuItem value="2">Awaiting Agent</MenuItem>
                        <MenuItem value="3">Awaiting Checklist</MenuItem>
                        <MenuItem value="4">Shipped</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Start Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={filters.dateRange.startDate || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: {
                            ...prev.dateRange,
                            startDate: e.target.value,
                          },
                        }))
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="End Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={filters.dateRange.endDate || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: {
                            ...prev.dateRange,
                            endDate: e.target.value,
                          },
                        }))
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      multiple
                      size="small"
                      options={availableAgents}
                      value={filters.agents}
                      onChange={(e, newValue) =>
                        setFilters((prev) => ({ ...prev, agents: newValue }))
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Agent" />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} display="flex" justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={resetFilters}
                    >
                      Reset Filters
                    </Button>
                  </Grid>
                </Grid>
              </Collapse>
            </Grid>
          </Grid>
        </SearchWrapper>

        {/* Results count */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="subtitle1">
            {filteredRequests.length} records found
          </Typography>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} elevation={3}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Request ID</TableCell>
                {isAdmin && <TableCell>Requestor</TableCell>}
                <TableCell>Project</TableCell>
                <StyledTableCell>Agent</StyledTableCell>
                <StyledTableCell>AWB</StyledTableCell>
                <StyledTableCell>Consignee</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Created On</StyledTableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 9 : 8}
                    align="center"
                    sx={{ py: 3 }}
                  >
                    <Typography variant="subtitle1" color="text.secondary">
                      No matching records found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((request) => (
                    <TableRow
                      key={request.request.id}
                      hover
                      onClick={() => {
                        setSelectedRequest(request);
                        setSampleModalOpen(true);
                      }}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>
                        <HighlightedText
                          text={request.request.id}
                          searchTerm={searchTerm}
                        />
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Box>
                            <HighlightedText
                              text={request.request.fullName}
                              searchTerm={searchTerm}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              <HighlightedText
                                text={request.request.staffEmail}
                                searchTerm={searchTerm}
                              />
                            </Typography>
                          </Box>
                        </TableCell>
                      )}
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            <HighlightedText
                              text={request.request.projectName}
                              searchTerm={searchTerm}
                            />
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <HighlightedText
                              text={request.request.chargeCode}
                              searchTerm={searchTerm}
                            />
                          </Typography>
                        </Box>
                      </TableCell>
                      <StyledTableCell>
                        <HighlightedText
                          text={request.request.primaryAgent || "N/A"}
                          searchTerm={searchTerm}
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <HighlightedText
                          text={request.request.awbNumber || "N/A"}
                          searchTerm={searchTerm}
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box>
                          <Typography variant="body2">
                            <HighlightedText
                              text={request.request.consigneeName || "N/A"}
                              searchTerm={searchTerm}
                            />
                          </Typography>
                          <Typography
                            variant="caption"
                            display="block"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Mail size={12} />
                            <HighlightedText
                              text={request.request.consigneeEmail || "N/A"}
                              searchTerm={searchTerm}
                            />
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <MapPin size={12} />
                            <HighlightedText
                              text={
                                (request.request.country
                                  ? request.request.country + ", "
                                  : "") + (request.request.address || "N/A")
                              }
                              searchTerm={searchTerm}
                            />
                          </Typography>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <StyledChip
                          label={getStatusText(request.request.statusId)}
                          color={getStatusColor(request.request.statusId)}
                          size="small"
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <HighlightedText
                          text={formatDate(request.request.createdDateTime)}
                          searchTerm={searchTerm}
                        />
                      </StyledTableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRequest(request);
                                setSampleModalOpen(true);
                              }}
                              sx={{
                                border: "1px solid",
                                borderColor: "primary.main",
                                "&:hover": {
                                  backgroundColor: "rgba(25, 118, 210, 0.04)",
                                },
                              }}
                            >
                              <Eye size={16} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Generate Invoice PDF">
                            <IconButton
                              color="secondary"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                generatePDF(request);
                              }}
                              disabled={
                                generatingPdfForId === request.request.id
                              }
                              sx={{
                                border: "1px solid",
                                borderColor: "secondary.main",
                                "&:hover": {
                                  backgroundColor: "rgba(156, 39, 176, 0.04)",
                                },
                              }}
                            >
                              {generatingPdfForId === request.request.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <FileText size={16} />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredRequests.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </TableContainer>

        <SampleDetailsModal
          isOpen={sampleModalOpen}
          onClose={() => setSampleModalOpen(false)}
          request={selectedRequest}
          onGeneratePDF={() => generatePDF(selectedRequest)}
          pdfGenerating={pdfGenerating}
          searchTerm={searchTerm}
        />
      </Box>
    </Box>
  );
};

const SampleDetailsModal = ({
  isOpen,
  onClose,
  request,
  onGeneratePDF,
  pdfGenerating,
  searchTerm,
}) => {
  if (!request?.request) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "#f0f0f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">
          Shipment Details #{request.request.id}
        </Typography>
        <IconButton onClick={onClose}>
          <X size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Request Information */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Request Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DetailItem
                    label="Requestor"
                    value={request.request.fullName}
                    searchTerm={searchTerm}
                  />
                  <DetailItem
                    label="Email"
                    value={request.request.staffEmail}
                    searchTerm={searchTerm}
                  />
                  <DetailItem
                    label="Project"
                    value={request.request.projectName}
                    searchTerm={searchTerm}
                  />
                  <DetailItem
                    label="Charge Code"
                    value={request.request.chargeCode}
                    searchTerm={searchTerm}
                  />
                  <DetailItem
                    label="SCC/Leo"
                    value={request.request.sccLeo}
                    searchTerm={searchTerm}
                  />
                  <DetailItem
                    label="Project PI MRCG"
                    value={request.request.projectPIMRCG}
                    searchTerm={searchTerm}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DetailItem
                    label="Status"
                    value={getStatusText(request.request.statusId)}
                    searchTerm={searchTerm}
                  />
                  <DetailItem
                    label="Is Hazardous"
                    value={request.request.isHazardous ? "Yes" : "No"}
                    searchTerm={searchTerm}
                  />
                  <DetailItem
                    label="Has MTA"
                    value={request.request.hasMTA ? "Yes" : "No"}
                    searchTerm={searchTerm}
                  />
                  <DetailItem
                    label="Purpose"
                    value={request.request.purpose}
                    searchTerm={searchTerm}
                  />
                  <DetailItem
                    label="Created Date"
                    value={formatDate(request.request.createdDateTime)}
                    searchTerm={searchTerm}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Shipping Information */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Shipping Information
              </Typography>
              {/* Consignee Details */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Consignee Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <DetailItem
                      label="Consignee Name"
                      value={request.request.consigneeName}
                      searchTerm={searchTerm}
                    />
                    <DetailItem
                      label="Consignee Email"
                      value={request.request.consigneeEmail}
                      searchTerm={searchTerm}
                    />
                    <DetailItem
                      label="Address"
                      value={request.request.address}
                      searchTerm={searchTerm}
                    />
                    <DetailItem
                      label="Country"
                      value={request.request.country}
                      searchTerm={searchTerm}
                    />
                    <DetailItem
                      label="Telephone"
                      value={request.request.tel}
                      searchTerm={searchTerm}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Shipping Details */}
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Shipping Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DetailItem
                    label="Primary Agent"
                    value={request.request.primaryAgent}
                    searchTerm={searchTerm}
                  />
                  <DetailItem
                    label="AWB Number"
                    value={request.request.awbNumber}
                    searchTerm={searchTerm}
                  />
                  <DetailItem
                    label="Total Weight"
                    value={`${request.shipmentDetail?.totalWeightKg} kg`}
                    searchTerm={searchTerm}
                  />
                  <DetailItem
                    label="Shipment Date"
                    value={formatDate(request.request.actualShipmentDate)}
                    searchTerm={searchTerm}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DetailItem
                    label="VAT Registration"
                    value={request.shipmentDetail?.vatRegistration}
                    searchTerm={searchTerm}
                  />
                  <DetailItem
                    label="EORI"
                    value={request.shipmentDetail?.eori}
                    searchTerm={searchTerm}
                  />
                  <DetailItem
                    label="HS Code"
                    value={request.shipmentDetail?.hsCode}
                    searchTerm={searchTerm}
                  />
                  <DetailItem
                    label="Incoterm"
                    value={request.shipmentDetail?.incoterm}
                    searchTerm={searchTerm}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Sample Descriptions */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Sample Descriptions
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Sample Type</TableCell>
                      <TableCell>Container</TableCell>
                      <TableCell>Box ID</TableCell>
                      <TableCell>Total Number</TableCell>
                      <TableCell>Volume (ml)</TableCell>
                      <TableCell>Overpack Type</TableCell>
                      <TableCell>Overpack ID</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {request.request.sampleDescriptions?.map(
                      (sample, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <HighlightedText
                              text={sample.sampleType}
                              searchTerm={searchTerm}
                            />
                          </TableCell>
                          <TableCell>
                            <HighlightedText
                              text={sample.containerType}
                              searchTerm={searchTerm}
                            />
                          </TableCell>
                          <TableCell>
                            <HighlightedText
                              text={sample.boxID}
                              searchTerm={searchTerm}
                            />
                          </TableCell>
                          <TableCell>
                            <HighlightedText
                              text={sample.totalNumber}
                              searchTerm={searchTerm}
                            />
                          </TableCell>
                          <TableCell>
                            <HighlightedText
                              text={sample.totalVolume}
                              searchTerm={searchTerm}
                            />
                          </TableCell>
                          <TableCell>
                            <HighlightedText
                              text={sample.overpackType}
                              searchTerm={searchTerm}
                            />
                          </TableCell>
                          <TableCell>
                            <HighlightedText
                              text={sample.overpackID}
                              searchTerm={searchTerm}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Overpack Summaries */}
          {request.shipmentDetail?.overpackSummaries?.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Overpack Summary
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Dimensions</TableCell>
                        <TableCell>Ice Capacity (kg)</TableCell>
                        <TableCell>Ice Used (kg)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {request.shipmentDetail.overpackSummaries.map(
                        (summary, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <HighlightedText
                                text={summary.overpackType}
                                searchTerm={searchTerm}
                              />
                            </TableCell>
                            <TableCell>
                              <HighlightedText
                                text={summary.totalOverpacks}
                                searchTerm={searchTerm}
                              />
                            </TableCell>
                            <TableCell>
                              <HighlightedText
                                text={summary.externalDimensions}
                                searchTerm={searchTerm}
                              />
                            </TableCell>
                            <TableCell>
                              <HighlightedText
                                text={parseFloat(
                                  summary.dryIceCapacity
                                ).toFixed(2)}
                                searchTerm={searchTerm}
                              />
                            </TableCell>
                            <TableCell>
                              <HighlightedText
                                text={parseFloat(summary.dryIceUsed).toFixed(2)}
                                searchTerm={searchTerm}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}

          {/* Transfer Guarantee Section */}
          {(request.request.aliquotsLeft ||
            request.request.noThirdParty ||
            request.request.aidsApproval ||
            request.request.purposeOnly) && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Transfer of Biological Samples Guarantee
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {request.request.aliquotsLeft && (
                    <Typography
                      variant="body2"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <Box
                        component="span"
                        sx={{ color: "success.main", fontWeight: "bold" }}
                      >
                        ✓
                      </Box>
                      <HighlightedText
                        text="Aliquots of the sample, appropriately labelled, have been left in The Gambia together with relevant documentation."
                        searchTerm={searchTerm}
                      />
                    </Typography>
                  )}
                  {request.request.noThirdParty && (
                    <Typography
                      variant="body2"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <Box
                        component="span"
                        sx={{ color: "success.main", fontWeight: "bold" }}
                      >
                        ✓
                      </Box>
                      <HighlightedText
                        text="These samples will not be passed on in whole or in part to a third party without permission from The Gambia Government/MRC Ethical Committee."
                        searchTerm={searchTerm}
                      />
                    </Typography>
                  )}
                  {request.request.aidsApproval && (
                    <Typography
                      variant="body2"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <Box
                        component="span"
                        sx={{ color: "success.main", fontWeight: "bold" }}
                      >
                        ✓
                      </Box>
                      <HighlightedText
                        text="The approval of the National AIDS Committee has been obtained for the transfer of any samples relating to AIDS patients or AIDS research."
                        searchTerm={searchTerm}
                      />
                    </Typography>
                  )}
                  {request.request.purposeOnly && (
                    <Typography
                      variant="body2"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <Box
                        component="span"
                        sx={{ color: "success.main", fontWeight: "bold" }}
                      >
                        ✓
                      </Box>
                      <HighlightedText
                        text="The samples will not be used for any other purpose other than for which approval was given."
                        searchTerm={searchTerm}
                      />
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onGeneratePDF}
          variant="outlined"
          color="primary"
          startIcon={
            pdfGenerating ? (
              <CircularProgress size={20} />
            ) : (
              <FileText size={20} />
            )
          }
          disabled={pdfGenerating}
        >
          Generate Invoice PDF
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DetailItem = ({ label, value, searchTerm }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2">
      <HighlightedText text={value || "N/A"} searchTerm={searchTerm} />
    </Typography>
  </Box>
);

export default ShipperRequests;
