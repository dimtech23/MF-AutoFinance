import React, { useState, useEffect, useContext, useMemo } from "react";
import api from "../../api";
import { UserContext } from "Context/UserContext";
import Header from "components/Headers/Header";
import { toast } from "react-toastify";

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
  IconButton,
  Backdrop,
  Box,
  Chip,
  Card,
  CardContent,
  TablePagination,
  Grid,
  Divider,
  TextField,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import { styled } from "@mui/material/styles";
import axios from "axios";

const baseURL =
  process.env.NODE_ENV === "production"
    ? "https://apps.mrc.gm/bioship"
    : "https://localhost:7097";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${theme.breakpoints.down("sm")}`]: {
    display: "none",
  },
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  fontWeight: "bold",
  padding: theme.spacing(0.5, 1),
}));

const SearchWrapper = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
}));

// Highlighted text component for search results
const HighlightedText = ({ text, searchTerm }) => {
  if (!searchTerm || searchTerm.trim() === '' || !text) {
    return <span>{text}</span>;
  }
  
  const term = searchTerm.trim();
  const parts = String(text).split(new RegExp(`(${term})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, index) => 
        part.toLowerCase() === term.toLowerCase() ? (
          <mark key={index} style={{ backgroundColor: 'yellow', padding: 0 }}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

const MyRequests = () => {
  const { userName, userRole } = useContext(UserContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [selectedSamples, setSelectedSamples] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const isAdmin = userRole === "Admin";

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const endpoint = isAdmin
          ? `${baseURL}/api/SampleRequests`
          : `${baseURL}/api/SampleRequests/GetUserSpecificRequests/${userName}`;

        const response = await axios.get(endpoint);

        let processedData;
        if (isAdmin) {
          processedData = response.data || [];
        } else {
          processedData = response.data.requests || [];
        }

        setRequests(processedData);
      } catch (error) {
        console.error("Error fetching requests:", error);
        toast.error("Error loading requests. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (userName) {
      fetchRequests();
    }
  }, [userName, isAdmin]);

  // Filtered requests based on search term
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const statusText = getStatusText(request.statusId).toLowerCase();
      
      return (
        (request.id?.toString() || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.projectName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.sccLeo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.projectPIMRCG || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.country || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        statusText.includes(searchTerm.toLowerCase())
      );
    });
  }, [requests, searchTerm]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date unavailable";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openSampleModal = (request) => {
    setSelectedRequest(request);
    setSampleModalOpen(true);
  };

  const closeSampleModal = () => {
    setSelectedSamples([]);
    setSelectedRequest({});
    setSampleModalOpen(false);
  };

  if (loading) {
    return (
      <Backdrop open={true} style={{ color: "#fff", zIndex: 10 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  const DetailItem = ({ label, value }) => (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#f5f5f5",
          p: 3,
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#333", mb: 3 }}
        >
          {isAdmin ? "All Sample Requests" : "My Sample Requests"}
        </Typography>

        {/* Search Box */}
        <SearchWrapper>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by ID, name, project, status (e.g. pending, shipped)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
          />
        </SearchWrapper>

        {/* Results count */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">
            {filteredRequests.length} records found
          </Typography>
        </Box>

        {filteredRequests.length === 0 ? (
          <Card
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CardContent>
              <Typography variant="h6" align="center">
                No matching requests found.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <TableContainer
            component={Paper}
            elevation={3}
            sx={{ flexGrow: 1, maxHeight: "calc(100vh - 300px)" }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", bgcolor: "#f0f0f0" }}>
                    Request ID
                  </TableCell>
                  {isAdmin && (
                    <TableCell sx={{ fontWeight: "bold", bgcolor: "#f0f0f0" }}>
                      Requestor
                    </TableCell>
                  )}
                  <TableCell sx={{ fontWeight: "bold", bgcolor: "#f0f0f0" }}>
                    Project Name
                  </TableCell>
                  <StyledTableCell
                    sx={{ fontWeight: "bold", bgcolor: "#f0f0f0" }}
                  >
                    SCC/Leo
                  </StyledTableCell>
                  <StyledTableCell
                    sx={{ fontWeight: "bold", bgcolor: "#f0f0f0" }}
                  >
                    Project PI MRCG
                  </StyledTableCell>
                  <StyledTableCell
                    sx={{ fontWeight: "bold", bgcolor: "#f0f0f0" }}
                  >
                    Country
                  </StyledTableCell>
                  <StyledTableCell
                    sx={{ fontWeight: "bold", bgcolor: "#f0f0f0" }}
                  >
                    Status
                  </StyledTableCell>
                  <StyledTableCell
                    sx={{ fontWeight: "bold", bgcolor: "#f0f0f0" }}
                  >
                    Created On
                  </StyledTableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: "bold", bgcolor: "#f0f0f0" }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell>
                        <HighlightedText 
                          text={request.id} 
                          searchTerm={searchTerm} 
                        />
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <HighlightedText 
                            text={request.fullName} 
                            searchTerm={searchTerm} 
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <HighlightedText 
                          text={request.projectName} 
                          searchTerm={searchTerm} 
                        />
                      </TableCell>
                      <StyledTableCell>
                        <HighlightedText 
                          text={request.sccLeo} 
                          searchTerm={searchTerm} 
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <HighlightedText 
                          text={request.projectPIMRCG} 
                          searchTerm={searchTerm} 
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <HighlightedText 
                          text={request.country || "N/A"} 
                          searchTerm={searchTerm} 
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <StyledChip
                          label={
                            <HighlightedText 
                              text={getStatusText(request.statusId)} 
                              searchTerm={searchTerm} 
                            />
                          }
                          color={getStatusColor(request.statusId)}
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        {formatDate(request.createdDateTime)}
                      </StyledTableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<VisibilityIcon />}
                          onClick={() => openSampleModal(request)}
                          size="small"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredRequests.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        )}
      </Box>

      <SampleModal
        isOpen={sampleModalOpen}
        onRequestClose={closeSampleModal}
        samples={selectedSamples}
        request={selectedRequest}
        searchTerm={searchTerm}
      />
    </Box>
  );
};

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
    case 5:
      return "Completed";
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
    case 5:
      return "error";
    default:
      return "default";
  }
};

const SampleModal = ({ isOpen, onRequestClose, request, searchTerm }) => {
  // Ensure request isn't empty
  const requestData = request || {};

  return (
    <Dialog open={isOpen} onClose={onRequestClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ backgroundColor: "#f0f0f0", color: "#333" }}>
        Shipment Details
        <IconButton
          aria-label="close"
          onClick={onRequestClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="h6" gutterBottom>
          Request Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle1">
              Request ID: <HighlightedText text={requestData.id || "N/A"} searchTerm={searchTerm} />
            </Typography>
            <Typography variant="subtitle1">
              Full Name: <HighlightedText text={requestData.fullName || "N/A"} searchTerm={searchTerm} />
            </Typography>
            <Typography variant="subtitle1">
              Project Name: <HighlightedText text={requestData.projectName || "N/A"} searchTerm={searchTerm} />
            </Typography>
            <Typography variant="subtitle1">
              Charge Code: <HighlightedText text={requestData.chargeCode || "N/A"} searchTerm={searchTerm} />
            </Typography>
            <Typography variant="subtitle1">
              SCC/Leo: <HighlightedText text={requestData.sccLeo || "N/A"} searchTerm={searchTerm} />
            </Typography>
            <Typography variant="subtitle1">
              Project PI MRCG: <HighlightedText text={requestData.projectPIMRCG || "N/A"} searchTerm={searchTerm} />
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle1">
              Status: <HighlightedText text={getStatusText(requestData.statusId || 0)} searchTerm={searchTerm} />
            </Typography>
            <Typography variant="subtitle1">
              Shipment Modes:{" "}
              <HighlightedText 
                text={requestData.shipmentModes ? requestData.shipmentModes.join(", ") : "N/A"} 
                searchTerm={searchTerm} 
              />
            </Typography>
            <Typography variant="subtitle1">
              Is Hazardous: {requestData.isHazardous ? "Yes" : "No"}
            </Typography>
            <Typography variant="subtitle1">
              Has MTA: {requestData.hasMTA ? "Yes" : "No"}
            </Typography>
            <Typography variant="subtitle1">
              Purpose: <HighlightedText text={requestData.purpose || "N/A"} searchTerm={searchTerm} />
            </Typography>
            <Typography variant="subtitle1">
              Created Date:{" "}
              {requestData.createdDateTime
                ? new Date(requestData.createdDateTime).toLocaleString()
                : "N/A"}
            </Typography>
          </Grid>
        </Grid>

        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          Consignee Information
        </Typography>
        <Typography variant="subtitle1">
          Name: <HighlightedText text={requestData.consigneeName || "N/A"} searchTerm={searchTerm} />
        </Typography>
        <Typography variant="subtitle1">
          Email: <HighlightedText text={requestData.consigneeEmail || "N/A"} searchTerm={searchTerm} />
        </Typography>
        <Typography variant="subtitle1">
          Country: <HighlightedText text={requestData.country || "N/A"} searchTerm={searchTerm} />
        </Typography>
        <Typography variant="subtitle1">
          Address: <HighlightedText text={requestData.address || "N/A"} searchTerm={searchTerm} />
        </Typography>
        <Typography variant="subtitle1">
          Tel: <HighlightedText text={requestData.tel || "N/A"} searchTerm={searchTerm} />
        </Typography>

        {requestData.statusId === 2 && requestData.shipmentDetail && (
          <>
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Shipment Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle1">
                  Total Weight (Kg):{" "}
                  {requestData.shipmentDetail.totalWeightKg || 0}
                </Typography>
                <Typography variant="subtitle1">
                  Agent: <HighlightedText text={requestData.shipmentDetail.agent || "N/A"} searchTerm={searchTerm} />
                </Typography>
                <Typography variant="subtitle1">
                  VAT Registration:{" "}
                  <HighlightedText text={requestData.shipmentDetail.vatRegistration || "N/A"} searchTerm={searchTerm} />
                </Typography>
                <Typography variant="subtitle1">
                  EORI: <HighlightedText text={requestData.shipmentDetail.eori || "N/A"} searchTerm={searchTerm} />
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">
                  HS Code: <HighlightedText text={requestData.shipmentDetail.hsCode || "N/A"} searchTerm={searchTerm} />
                </Typography>
                <Typography variant="subtitle1">
                  Incoterm: <HighlightedText text={requestData.shipmentDetail.incoterm || "N/A"} searchTerm={searchTerm} />
                </Typography>
                <Typography variant="subtitle1">
                  Product Description:{" "}
                  <HighlightedText text={requestData.shipmentDetail.productDescription || "N/A"} searchTerm={searchTerm} />
                </Typography>
              </Grid>
            </Grid>

            {requestData.shipmentDetail.overpackSummaries &&
              requestData.shipmentDetail.overpackSummaries.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    Overpack Summaries
                  </Typography>
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{ mt: 2 }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                          <TableCell>Overpack Type</TableCell>
                          <TableCell>Total Overpacks</TableCell>
                          <TableCell>External Dimensions</TableCell>
                          <TableCell>Dry Ice Capacity</TableCell>
                          <TableCell>Dry Ice Used</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {requestData.shipmentDetail.overpackSummaries.map(
                          (summary, index) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                <HighlightedText text={summary.overpackType || "N/A"} searchTerm={searchTerm} />
                              </TableCell>
                              <TableCell>
                                {summary.totalOverpacks || 0}
                              </TableCell>
                              <TableCell>
                                <HighlightedText text={summary.externalDimensions || "N/A"} searchTerm={searchTerm} />
                              </TableCell>
                              <TableCell>
                                {summary.dryIceCapacity || 0}
                              </TableCell>
                              <TableCell>{summary.dryIceUsed || 0}</TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
          </>
        )}

        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          Sample Descriptions
        </Typography>
        <TableContainer component={Paper} elevation={0} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>Sample Type</TableCell>
                <TableCell>Container Type</TableCell>
                <TableCell>Box ID</TableCell>
                <TableCell align="right">Total Number</TableCell>
                <TableCell align="right">Total Volume</TableCell>
                {requestData.statusId === 2 && (
                  <>
                    <TableCell>Overpack Type</TableCell>
                    <TableCell>Overpack ID</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {requestData.sampleDescriptions &&
              requestData.sampleDescriptions.length > 0 ? (
                requestData.sampleDescriptions.map((sample, index) => (
                  <TableRow key={index} hover>
                    <TableCell><HighlightedText text={sample.sampleType || "N/A"} searchTerm={searchTerm} /></TableCell>
                    <TableCell><HighlightedText text={sample.containerType || "N/A"} searchTerm={searchTerm} /></TableCell>
                    <TableCell><HighlightedText text={sample.boxID || "N/A"} searchTerm={searchTerm} /></TableCell>
                    <TableCell align="right">
                      {sample.totalNumber || 0}
                    </TableCell>
                    <TableCell align="right">
                      {sample.totalVolume || 0}
                    </TableCell>
                    {requestData.statusId === 2 && (
                      <>
                        <TableCell><HighlightedText text={sample.overpackType || "N/A"} searchTerm={searchTerm} /></TableCell>
                        <TableCell><HighlightedText text={sample.overpackID || "N/A"} searchTerm={searchTerm} /></TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={requestData.statusId === 2 ? 7 : 5}
                    align="center"
                  >
                    No sample descriptions available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Transfer Guarantee Section */}
        {(requestData.aliquotsLeft ||
          requestData.noThirdParty ||
          requestData.aidsApproval ||
          requestData.purposeOnly) && (
          <div style={{ marginTop: "20px" }}>
            <Typography variant="h6" gutterBottom>
              Transfer of Biological Samples Guarantee
            </Typography>
            <Grid container spacing={2}>
              {requestData.aliquotsLeft && (
                <Grid item xs={12}>
                  <Typography variant="body2">
                    ✓ Aliquots of the sample, appropriately labelled, have been
                    left in The Gambia together with relevant documentation.
                  </Typography>
                </Grid>
              )}
              {requestData.noThirdParty && (
                <Grid item xs={12}>
                  <Typography variant="body2">
                    ✓ These samples will not be passed on in whole or in part to
                    a third party without permission from The Gambia
                    Government/MRC Ethical Committee.
                  </Typography>
                </Grid>
              )}
              {requestData.aidsApproval && (
                <Grid item xs={12}>
                  <Typography variant="body2">
                    ✓ The approval of the National AIDS Committee has been
                    obtained for the transfer of any samples relating to AIDS
                    patients or AIDS research.
                  </Typography>
                </Grid>
              )}
              {requestData.purposeOnly && (
                <Grid item xs={12}>
                  <Typography variant="body2">
                    ✓ The samples will not be used for any other purpose other
                    than for which approval was given.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onRequestClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MyRequests;