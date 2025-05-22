import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { Camera, Upload, Download, Trash2, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { clientsAPI } from "../../api";
import { UserContext } from "../../Context/UserContext";

const DeliveryDocs = () => {
  const { token } = useContext(UserContext);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [uploadImages, setUploadImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientsAPI.getAll();
      if (response && response.data) {
        // Filter for clients that are completed but not delivered
        const filteredClients = response.data.filter(
          client => client.repairStatus === "completed" && client.paymentStatus === "paid"
        );
        setClients(filteredClients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadImages(files);
  };

  const handleUpload = async () => {
    if (!selectedClient || !uploadImages.length) {
      toast.error("Please select a client and upload at least one image");
      return;
    }

    try {
      setUploading(true);
      const uploadPromises = uploadImages.map(async (file) => {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("clientId", selectedClient.id || selectedClient._id);
        formData.append("type", "delivery");

        const response = await clientsAPI.uploadImage(formData);
        if (!response || !response.data) {
          throw new Error("Failed to upload image");
        }
        return response.data;
      });

      await Promise.all(uploadPromises);
      toast.success("Delivery documentation uploaded successfully");
      setUploadDialogOpen(false);
      setUploadImages([]);
      setSelectedClient(null);
      fetchClients(); // Refresh the list
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload some images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `delivery-doc-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image");
    }
  };

  const handleDelete = async (imageId) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      try {
        await clientsAPI.deleteImage(imageId);
        toast.success("Image deleted successfully");
        fetchClients(); // Refresh the list
      } catch (error) {
        console.error("Error deleting image:", error);
        toast.error("Failed to delete image");
      }
    }
  };

  const renderClientCard = (client) => (
    <Card key={client.id || client._id} sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="h6">{client.clientName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {client.carDetails?.make} {client.carDetails?.model} ({client.carDetails?.year})
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {client.deliveryImages?.map((image, index) => (
                <Box key={index} sx={{ position: 'relative' }}>
                  <img
                    src={image.url}
                    alt={`Delivery doc ${index + 1}`}
                    style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                  />
                  <Box sx={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Download">
                      <IconButton size="small" onClick={() => handleDownload(image.url)}>
                        <Download size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(image.id)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              startIcon={<Upload size={16} />}
              onClick={() => {
                setSelectedClient(client);
                setUploadDialogOpen(true);
              }}
            >
              Upload Docs
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Delivery Documentation</Typography>
        <Button
          variant="contained"
          startIcon={<Camera size={20} />}
          onClick={() => setUploadDialogOpen(true)}
        >
          New Upload
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : clients.length === 0 ? (
        <Alert severity="info">
          No clients pending delivery documentation.
        </Alert>
      ) : (
        clients.map(renderClientCard)
      )}

      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>
          Upload Delivery Documentation
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {!selectedClient && (
              <TextField
                select
                fullWidth
                label="Select Client"
                value={selectedClient?.id || ''}
                onChange={(e) => {
                  const client = clients.find(c => c.id === e.target.value);
                  setSelectedClient(client);
                }}
                SelectProps={{
                  native: true
                }}
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id || client._id} value={client.id || client._id}>
                    {client.clientName} - {client.carDetails?.make} {client.carDetails?.model}
                  </option>
                ))}
              </TextField>
            )}
            <Box sx={{ mt: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="delivery-image-upload"
                type="file"
                multiple
                onChange={handleImageUpload}
              />
              <label htmlFor="delivery-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<Upload />}
                  fullWidth
                >
                  Select Images
                </Button>
              </label>
            </Box>
            {uploadImages.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Selected images: {uploadImages.length}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {uploadImages.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      onDelete={() => {
                        setUploadImages(prev => prev.filter((_, i) => i !== index));
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedClient || !uploadImages.length || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DeliveryDocs; 