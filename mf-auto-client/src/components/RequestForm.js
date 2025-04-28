import React, { useState, useContext, useEffect, useRef } from "react";
import { useHistory, useParams } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import ExcelUploadGuide from "../components/ExcelUploadGuide";
import * as XLSX from "xlsx";
import {
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Col,
  Row,
  Card,
  CardBody,
  CardTitle,
  Collapse,
  Alert,
  Table,
} from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleDown,
  faAngleUp,
  faArrowUp,
  faCheckSquare,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { UserContext } from "Context/UserContext";
import "react-toastify/dist/ReactToastify.css";

const baseURL =
  process.env.NODE_ENV === "production"
    ? "https://apps.mrc.gm/bioship"
    : "https://localhost:7097";

const RequestForm = () => {
  const history = useHistory();
  const { userName, userEmail } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [declaration, setDeclaration] = useState(false);

  const { requestId } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalRequest, setOriginalRequest] = useState(null);

  const [transferGuarantee, setTransferGuarantee] = useState({
    aliquotsLeft: false,
    noThirdParty: false,
    aidsApproval: false,
    purposeOnly: false,
  });
  const [requestFormData, setRequestFormData] = useState({
    fullName: userName || "",
    staffEmail: userEmail || "",
    projectName: "",
    chargeCode: "",
    shipmentModes: [],
    sccLeo: "",
    projectPIMRCG: "",
    consigneeName: "",
    consigneeEmail: "",
    address: "",
    country: "",
    tel: "",
    sampleDescription: [
      {
        sampleType: "",
        containerType: "",
        boxID: "",
        totalNumber: "",
        totalVolume: "",
      },
    ],
    isHazardous: "",
    hasMTA: "",
    purpose: "",
    awbNumber: "",
    primaryAgent: "",
    shipmentCategory: "",
    checklistCompletedBy: "",
    checklistCompletedDate: null,
    completedChecklist: false,
    actualShipmentDate: null,
    aliquotsLeft: false,
    noThirdParty: false,
    aidsApproval: false,
    purposeOnly: false,
  });

  const [customContainerType, setCustomContainerType] = useState([]);
  const [containerType, setContainerType] = useState([]);
  const [budgetCodes, setBudgetCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [collapse1, setCollapse1] = useState(false);
  const [excelData, setExcelData] = useState([]);
  // const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const shipmentModes = [
    { value: "Liquid Nitrogen", label: "Liquid Nitrogen" },
    { value: "Dry Ice", label: "Dry Ice" },
    { value: "Ice Packs", label: "Ice Packs" },
    { value: "Ambient Temp", label: "Ambient Temp" },
  ];

  const containerTypes = [
    { value: "10x10 Cryo box", label: "10x10 Cryo box" },
    { value: "9x9 Cryo box", label: "9x9 Cryo box" },
    { value: "11x11 Cryo box", label: "11x11 Cryo box" },
    { value: "Universal Bijou", label: "Universal Bijou" },
    { value: "15 ml Falcon tubes", label: "15 ml Falcon tubes" },
    { value: "50 ml Falcon tubes", label: "50 ml Falcon tubes" },
    { value: "PCR plates", label: "PCR plates" },
    { value: "Microscope Slide Boxes", label: "Microscope Slide Boxes" },
    { value: "Filter Paper Packs", label: "Filter Paper Packs" },
    { value: "EDTA 10ml bottles", label: "EDTA 10ml bottles" },
    { value: "Paxgene", label: "Paxgene" },
    { value: "Others", label: "Others (Specify)" },
  ];

  const countries = [
    { value: "Afghanistan", label: "Afghanistan" },
    { value: "Albania", label: "Albania" },
    { value: "Algeria", label: "Algeria" },
    { value: "Andorra", label: "Andorra" },
    { value: "Angola", label: "Angola" },
    { value: "Antigua and Barbuda", label: "Antigua and Barbuda" },
    { value: "Argentina", label: "Argentina" },
    { value: "Armenia", label: "Armenia" },
    { value: "Australia", label: "Australia" },
    { value: "Austria", label: "Austria" },
    { value: "Azerbaijan", label: "Azerbaijan" },
    { value: "Bahamas", label: "Bahamas" },
    { value: "Bahrain", label: "Bahrain" },
    { value: "Bangladesh", label: "Bangladesh" },
    { value: "Barbados", label: "Barbados" },
    { value: "Belarus", label: "Belarus" },
    { value: "Belgium", label: "Belgium" },
    { value: "Belize", label: "Belize" },
    { value: "Benin", label: "Benin" },
    { value: "Bhutan", label: "Bhutan" },
    { value: "Bolivia", label: "Bolivia" },
    { value: "Bosnia and Herzegovina", label: "Bosnia and Herzegovina" },
    { value: "Botswana", label: "Botswana" },
    { value: "Brazil", label: "Brazil" },
    { value: "Brunei", label: "Brunei" },
    { value: "Bulgaria", label: "Bulgaria" },
    { value: "Burkina Faso", label: "Burkina Faso" },
    { value: "Burundi", label: "Burundi" },
    { value: "Cabo Verde", label: "Cabo Verde" },
    { value: "Cambodia", label: "Cambodia" },
    { value: "Cameroon", label: "Cameroon" },
    { value: "Canada", label: "Canada" },
    { value: "Central African Republic", label: "Central African Republic" },
    { value: "Chad", label: "Chad" },
    { value: "Chile", label: "Chile" },
    { value: "China", label: "China" },
    { value: "Colombia", label: "Colombia" },
    { value: "Comoros", label: "Comoros" },
    { value: "Congo", label: "Congo" },
    { value: "Costa Rica", label: "Costa Rica" },
    { value: "Croatia", label: "Croatia" },
    { value: "Cuba", label: "Cuba" },
    { value: "Cyprus", label: "Cyprus" },
    { value: "Czech Republic", label: "Czech Republic" },
    { value: "Denmark", label: "Denmark" },
    { value: "Djibouti", label: "Djibouti" },
    { value: "Dominica", label: "Dominica" },
    { value: "Dominican Republic", label: "Dominican Republic" },
    { value: "DR Congo", label: "DR Congo" },
    { value: "Ecuador", label: "Ecuador" },
    { value: "Egypt", label: "Egypt" },
    { value: "El Salvador", label: "El Salvador" },
    { value: "Equatorial Guinea", label: "Equatorial Guinea" },
    { value: "Eritrea", label: "Eritrea" },
    { value: "Estonia", label: "Estonia" },
    { value: "Eswatini", label: "Eswatini" },
    { value: "Ethiopia", label: "Ethiopia" },
    { value: "Fiji", label: "Fiji" },
    { value: "Finland", label: "Finland" },
    { value: "France", label: "France" },
    { value: "Gabon", label: "Gabon" },
    { value: "Gambia", label: "Gambia" },
    { value: "Georgia", label: "Georgia" },
    { value: "Germany", label: "Germany" },
    { value: "Ghana", label: "Ghana" },
    { value: "Greece", label: "Greece" },
    { value: "Grenada", label: "Grenada" },
    { value: "Guatemala", label: "Guatemala" },
    { value: "Guinea", label: "Guinea" },
    { value: "Guinea-Bissau", label: "Guinea-Bissau" },
    { value: "Guyana", label: "Guyana" },
    { value: "Haiti", label: "Haiti" },
    { value: "Honduras", label: "Honduras" },
    { value: "Hungary", label: "Hungary" },
    { value: "Iceland", label: "Iceland" },
    { value: "India", label: "India" },
    { value: "Indonesia", label: "Indonesia" },
    { value: "Iran", label: "Iran" },
    { value: "Iraq", label: "Iraq" },
    { value: "Ireland", label: "Ireland" },
    { value: "Israel", label: "Israel" },
    { value: "Italy", label: "Italy" },
    { value: "Jamaica", label: "Jamaica" },
    { value: "Japan", label: "Japan" },
    { value: "Jordan", label: "Jordan" },
    { value: "Kazakhstan", label: "Kazakhstan" },
    { value: "Kenya", label: "Kenya" },
    { value: "Kiribati", label: "Kiribati" },
    { value: "Kuwait", label: "Kuwait" },
    { value: "Kyrgyzstan", label: "Kyrgyzstan" },
    { value: "Laos", label: "Laos" },
    { value: "Latvia", label: "Latvia" },
    { value: "Lebanon", label: "Lebanon" },
    { value: "Lesotho", label: "Lesotho" },
    { value: "Liberia", label: "Liberia" },
    { value: "Libya", label: "Libya" },
    { value: "Liechtenstein", label: "Liechtenstein" },
    { value: "Lithuania", label: "Lithuania" },
    { value: "Luxembourg", label: "Luxembourg" },
    { value: "Madagascar", label: "Madagascar" },
    { value: "Malawi", label: "Malawi" },
    { value: "Malaysia", label: "Malaysia" },
    { value: "Maldives", label: "Maldives" },
    { value: "Mali", label: "Mali" },
    { value: "Malta", label: "Malta" },
    { value: "Marshall Islands", label: "Marshall Islands" },
    { value: "Mauritania", label: "Mauritania" },
    { value: "Mauritius", label: "Mauritius" },
    { value: "Mexico", label: "Mexico" },
    { value: "Micronesia", label: "Micronesia" },
    { value: "Moldova", label: "Moldova" },
    { value: "Monaco", label: "Monaco" },
    { value: "Mongolia", label: "Mongolia" },
    { value: "Montenegro", label: "Montenegro" },
    { value: "Morocco", label: "Morocco" },
    { value: "Mozambique", label: "Mozambique" },
    { value: "Myanmar", label: "Myanmar" },
    { value: "Namibia", label: "Namibia" },
    { value: "Nauru", label: "Nauru" },
    { value: "Nepal", label: "Nepal" },
    { value: "Netherlands", label: "Netherlands" },
    { value: "New Zealand", label: "New Zealand" },
    { value: "Nicaragua", label: "Nicaragua" },
    { value: "Niger", label: "Niger" },
    { value: "Nigeria", label: "Nigeria" },
    { value: "North Korea", label: "North Korea" },
    { value: "North Macedonia", label: "North Macedonia" },
    { value: "Norway", label: "Norway" },
    { value: "Oman", label: "Oman" },
    { value: "Pakistan", label: "Pakistan" },
    { value: "Palau", label: "Palau" },
    { value: "Palestine", label: "Palestine" },
    { value: "Panama", label: "Panama" },
    { value: "Papua New Guinea", label: "Papua New Guinea" },
    { value: "Paraguay", label: "Paraguay" },
    { value: "Peru", label: "Peru" },
    { value: "Philippines", label: "Philippines" },
    { value: "Poland", label: "Poland" },
    { value: "Portugal", label: "Portugal" },
    { value: "Qatar", label: "Qatar" },
    { value: "Romania", label: "Romania" },
    { value: "Russia", label: "Russia" },
    { value: "Rwanda", label: "Rwanda" },
    { value: "Saint Kitts and Nevis", label: "Saint Kitts and Nevis" },
    { value: "Saint Lucia", label: "Saint Lucia" },
    {
      value: "Saint Vincent and the Grenadines",
      label: "Saint Vincent and the Grenadines",
    },
    { value: "Samoa", label: "Samoa" },
    { value: "San Marino", label: "San Marino" },
    { value: "Sao Tome and Principe", label: "Sao Tome and Principe" },
    { value: "Saudi Arabia", label: "Saudi Arabia" },
    { value: "Senegal", label: "Senegal" },
    { value: "Serbia", label: "Serbia" },
    { value: "Seychelles", label: "Seychelles" },
    { value: "Sierra Leone", label: "Sierra Leone" },
    { value: "Singapore", label: "Singapore" },
    { value: "Slovakia", label: "Slovakia" },
    { value: "Slovenia", label: "Slovenia" },
    { value: "Solomon Islands", label: "Solomon Islands" },
    { value: "Somalia", label: "Somalia" },
    { value: "South Africa", label: "South Africa" },
    { value: "South Korea", label: "South Korea" },
    { value: "South Sudan", label: "South Sudan" },
    { value: "Spain", label: "Spain" },
    { value: "Sri Lanka", label: "Sri Lanka" },
    { value: "Sudan", label: "Sudan" },
    { value: "Suriname", label: "Suriname" },
    { value: "Sweden", label: "Sweden" },
    { value: "Switzerland", label: "Switzerland" },
    { value: "Syria", label: "Syria" },
    { value: "Taiwan", label: "Taiwan" },
    { value: "Tajikistan", label: "Tajikistan" },
    { value: "Tanzania", label: "Tanzania" },
    { value: "Thailand", label: "Thailand" },
    { value: "Timor-Leste", label: "Timor-Leste" },
    { value: "Togo", label: "Togo" },
    { value: "Tonga", label: "Tonga" },
    { value: "Trinidad and Tobago", label: "Trinidad and Tobago" },
    { value: "Tunisia", label: "Tunisia" },
    { value: "Turkey", label: "Turkey" },
    { value: "Turkmenistan", label: "Turkmenistan" },
    { value: "Tuvalu", label: "Tuvalu" },
    { value: "Uganda", label: "Uganda" },
    { value: "Ukraine", label: "Ukraine" },
    { value: "United Arab Emirates", label: "United Arab Emirates" },
    { value: "United Kingdom", label: "United Kingdom" },
    { value: "United States", label: "United States" },
    { value: "Uruguay", label: "Uruguay" },
    { value: "Uzbekistan", label: "Uzbekistan" },
    { value: "Vanuatu", label: "Vanuatu" },
    { value: "Vatican City", label: "Vatican City" },
    { value: "Venezuela", label: "Venezuela" },
    { value: "Vietnam", label: "Vietnam" },
    { value: "Yemen", label: "Yemen" },
    { value: "Zambia", label: "Zambia" },
    { value: "Zimbabwe", label: "Zimbabwe" },
  ].sort((a, b) => a.label.localeCompare(b.label));

  const handleContainerTypeChange = (selectedOption, index) => {
    const updatedContainerTypes = [...containerType];
    updatedContainerTypes[index] = selectedOption.value;
    setContainerType(updatedContainerTypes);

    handleArrayChange(
      "sampleDescription",
      index,
      "containerType",
      selectedOption.value
    );

    if (selectedOption.value !== "Others") {
      const updatedCustomTypes = [...customContainerType];
      updatedCustomTypes[index] = "";
      setCustomContainerType(updatedCustomTypes);
    }
  };

  useEffect(() => {
    const fetchBudgetCodes = async () => {
      try {
        const response = await axios.get(
          `${baseURL}/BudgetApprovers/BudgetCode`
        );
        setBudgetCodes(
          response.data.map((code) => ({
            value: code.budgetCode,
            label: `${code.budgetCode} - ${code.budgetName}`,
            budgetName: code.budgetName,
          }))
        );
      } catch (error) {
        console.error(
          "Error fetching budget codes:",
          error.response ? error.response.data : error.message
        );
        toast.error("Failed to fetch budget codes. Please try again later.");
      }
    };

    fetchBudgetCodes();
  }, []);

  useEffect(() => {
    setRequestFormData((prevFormData) => ({
      ...prevFormData,
      fullName: userName || "",
      staffEmail: userEmail || "",
    }));
  }, [userName, userEmail]);

  useEffect(() => {
    if (isSubmitted && Object.keys(validationErrors).length > 0) {
      // scrollToTop();
      // setShowScrollIndicator(true);
      // const timer = setTimeout(() => setShowScrollIndicator(false), 5000);
      // return () => clearTimeout(timer);
    }
  }, [validationErrors, isSubmitted]);

  useEffect(() => {
    if (requestId) {
      setIsEditMode(true);
      const fetchRequestData = async () => {
        try {
          const response = await axios.get(
            `${baseURL}/api/SampleRequests/${requestId}`
          );
          setOriginalRequest(response.data);

          // Pre-populate the form with existing data
          const request = response.data;
          setRequestFormData({
            fullName: request.fullName || userName,
            staffEmail: request.staffEmail || userEmail,
            projectName: request.projectName || "",
            chargeCode: request.chargeCode || "",
            shipmentModes: request.shipmentModes || [],
            sccLeo: request.sccLeo || "",
            projectPIMRCG: request.projectPIMRCG || "",
            consigneeName: request.consigneeName || "",
            consigneeEmail: request.consigneeEmail || "",
            address: request.address || "",
            country: request.country || "",
            tel: request.tel || "",
            sampleDescription: request.sampleDescriptions || [],
            isHazardous: request.isHazardous,
            hasMTA: request.hasMTA,
            purpose: request.purpose || "",
            aliquotsLeft: request.aliquotsLeft,
            noThirdParty: request.noThirdParty,
            aidsApproval: request.aidsApproval,
            purposeOnly: request.purposeOnly,
          });

          // Set transfer guarantee values
          setTransferGuarantee({
            aliquotsLeft: request.aliquotsLeft,
            noThirdParty: request.noThirdParty,
            aidsApproval: request.aidsApproval,
            purposeOnly: request.purposeOnly,
          });

          setDeclaration(true);

          // Handle container types for sample descriptions
          const containerTypesArray = request.sampleDescriptions.map(
            (desc) => desc.containerType
          );
          setContainerType(containerTypesArray);
        } catch (error) {
          console.error("Error fetching request data:", error);
          toast.error("Failed to load request data");
        }
      };

      fetchRequestData();
    }
  }, [requestId, userName, userEmail]);

  useEffect(() => {
    const fetchUsersList = async () => {
      try {
        const response = await fetch(
          `${baseURL}/api/users/get-mrc-users-csv-list`
        );
        const data = await response.json();

        const formattedData = data.map((user) => ({
          value: user.username,
          label: `${user.fullName} (${user.username})`,
        }));

        setUsers(formattedData);
      } catch (error) {
        console.error("Error fetching users list:", error);
        toast.error("Failed to fetch users list");
      }
    };

    fetchUsersList();
  }, []);

  const handleBudgetCodeChange = (selectedOption) => {
    setRequestFormData({
      ...requestFormData,
      chargeCode: selectedOption.value,
      projectName: selectedOption.budgetName,
    });
    setValidationErrors((prev) => ({
      ...prev,
      chargeCode: null,
      projectName: null,
    }));
  };

  const handleChange = (field, value) => {
    setRequestFormData((prevFormData) => ({
      ...prevFormData,
      [field]: value,
    }));
    setValidationErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleArrayChange = (field, index, subField, value) => {
    const updatedArray = [...requestFormData[field]];
    updatedArray[index][subField] = value;
    setRequestFormData((prevFormData) => ({
      ...prevFormData,
      [field]: updatedArray,
    }));
    setValidationErrors((prev) => ({ ...prev, sampleDescription: null }));
  };

  const handleAddField = (field) => {
    const newField =
      field === "sampleDescription"
        ? {
            sampleType: "",
            containerType: "",
            boxID: "",
            totalNumber: "",
            totalVolume: "",
          }
        : null;
    setRequestFormData((prevFormData) => ({
      ...prevFormData,
      [field]: [...prevFormData[field], newField],
    }));

    setCustomContainerType([...customContainerType, ""]);
  };

  const handleRemoveField = (field, index) => {
    const updatedArray = requestFormData[field].filter((_, i) => i !== index);
    setRequestFormData((prevFormData) => ({
      ...prevFormData,
      [field]: updatedArray,
    }));
  };

  const handleShipmentModeChange = (selectedOptions) => {
    setRequestFormData({
      ...requestFormData,
      shipmentModes: selectedOptions.map((option) => option.value),
    });
    setValidationErrors((prev) => ({ ...prev, shipmentModes: null }));
  };

  // Updated handler with console logging to debug
  const handleTransferGuaranteeChange = (field) => (e) => {
    const isChecked = e.target.checked;

    // Update transferGuarantee state
    setTransferGuarantee((prev) => ({
      ...prev,
      [field]: isChecked,
    }));

    // Also update requestFormData state
    setRequestFormData((prev) => ({
      ...prev,
      [field]: isChecked,
    }));

    // Debug log to verify state updates
    console.log(`${field} changed to ${isChecked}`);
    console.log("requestFormData updated:", {
      ...requestFormData,
      [field]: isChecked,
    });
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${baseURL}/api/SampleRequests/UploadExcel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setExcelData(response.data);
      toast.success("Excel file uploaded and processed successfully");
    } catch (error) {
      console.error("Error uploading Excel file:", error);
      toast.error("Failed to process Excel file. Please try again.");
    }
  };

  const validateForm = () => {
    const errors = {};
    const requiredFields = [
      "chargeCode",
      "projectName",
      "shipmentModes",
      "sccLeo",
      "projectPIMRCG",
      "consigneeName",
      "consigneeEmail",
      "address",
      "tel",
      "isHazardous",
      "hasMTA",
      "purpose",
    ];

    requiredFields.forEach((field) => {
      if (field === "shipmentModes") {
        if (!requestFormData[field] || requestFormData[field].length === 0) {
          errors[field] = "Please select at least one shipment mode";
        }
      } else if (field === "isHazardous" || field === "hasMTA") {
        if (requestFormData[field] === "") {
          errors[field] = "Please select Yes or No";
        }
      } else if (!requestFormData[field]) {
        errors[field] = "This field is required";
      }
    });

    if (!requestFormData.consigneeEmail) {
      errors.consigneeEmail = "Consignee email is required";
    } else if (!/\S+@\S+\.\S+/.test(requestFormData.consigneeEmail)) {
      errors.consigneeEmail = "Please enter a valid email address";
    }

    if (!declaration) {
      errors.declaration = "Please agree to the declaration";
    }

    if (
      excelData.length === 0 &&
      (requestFormData.sampleDescription.length === 0 ||
        requestFormData.sampleDescription.some(
          (desc) =>
            !desc.sampleType ||
            !desc.containerType ||
            !desc.boxID ||
            !desc.totalNumber ||
            !desc.totalVolume
        ))
    ) {
      errors.sampleDescription =
        "Please provide complete sample description(s) or upload an Excel file";
      setCollapse1(true);
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSubmitted(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    const sampleDescriptions =
      excelData.length > 0 ? excelData : requestFormData.sampleDescription;

    try {
      let response;

      if (isEditMode) {
        // Update existing request
        const dataToSend = {
          ...requestFormData,
          id: parseInt(requestId),
          sampleDescriptions: sampleDescriptions.map((desc) => ({
            sampleType: desc.sampleType,
            containerType: desc.containerType,
            boxID: desc.boxID,
            totalNumber: parseInt(desc.totalNumber) || 0,
            totalVolume: parseFloat(desc.totalVolume) || 0,
          })),
          aliquotsLeft: transferGuarantee.aliquotsLeft,
          noThirdParty: transferGuarantee.noThirdParty,
          aidsApproval: transferGuarantee.aidsApproval,
          purposeOnly: transferGuarantee.purposeOnly,
        };

        response = await axios.put(
          `${baseURL}/api/SampleRequests/${requestId}/EditPending`,
          dataToSend,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          toast.success("Request updated successfully!");
          setTimeout(() => {
            history.push("/admin/my-request");
          }, 2000);
        } else {
          toast.error(
            response.data.message || "Update failed. Please try again."
          );
        }
      } else {
        // Create new request
        const dataToSend = {
          ...requestFormData,
          sampleDescriptions: sampleDescriptions.map((desc) => ({
            sampleType: desc.sampleType,
            containerType: desc.containerType,
            boxID: desc.boxID,
            totalNumber: parseInt(desc.totalNumber) || 0,
            totalVolume: parseFloat(desc.totalVolume) || 0,
          })),
          aliquotsLeft: transferGuarantee.aliquotsLeft,
          noThirdParty: transferGuarantee.noThirdParty,
          aidsApproval: transferGuarantee.aidsApproval,
          purposeOnly: transferGuarantee.purposeOnly,
          awbNumber: "Pending",
          primaryAgent: "Pending",
          shipmentCategory: "Pending",
          checklistCompletedBy: userName || "Pending",
          checklistCompletedDate: null,
          completedChecklist: false,
          actualShipmentDate: null,
          shipmentDetail: null,
        };

        response = await axios.post(
          `${baseURL}/api/SampleRequests/SubmitRequest`,
          dataToSend,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          toast.success("Sample request submitted successfully!");
          resetForm();
          setTimeout(() => {
            history.push("/admin/my-request", { newRequest: true });
          }, 2000);
        } else {
          toast.error(
            response.data.message || "Submission failed. Please try again."
          );
        }
      }
    } catch (error) {
      console.error(
        "Error submitting form:",
        error.response ? error.response.data : error
      );
      toast.error(
        error.response?.data?.message ||
          "An unexpected error occurred. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setRequestFormData({
      fullName: userName || "",
      staffEmail: userEmail || "",
      projectName: "",
      chargeCode: "",
      shipmentModes: [],
      sccLeo: "",
      projectPIMRCG: "",
      consigneeName: "",
      address: "",
      tel: "",
      sampleDescription: [
        {
          sampleType: "",
          containerType: "",
          boxID: "",
          totalNumber: "",
          totalVolume: "",
        },
      ],
      isHazardous: "",
      hasMTA: "",
      purpose: "",
      awbNumber: "",
      primaryAgent: "",
      shipmentCategory: "",
      checklistCompletedBy: "",
      checklistCompletedDate: null,
      completedChecklist: false,
      actualShipmentDate: null,
    });
    setExcelData([]);
    setTransferGuarantee({
      aliquotsLeft: false,
      noThirdParty: false,
      aidsApproval: false,
      purposeOnly: false,
    });
    setDeclaration(false);
  };

  const renderErrorMessage = (field) => {
    if (validationErrors[field]) {
      return (
        <Alert color="danger" className="mt-2 p-2 d-flex align-items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
          {validationErrors[field]}
        </Alert>
      );
    }
    return null;
  };

  return (
    <div className="form-container">
      <ToastContainer />
      <Card>
        <CardBody>
          {isEditMode && originalRequest?.shipperComments && (
            <Alert color="info" className="mb-4">
              <h5 className="alert-heading">Shipper Comments</h5>
              <p>{originalRequest.shipperComments}</p>
              <hr />
              <p className="mb-0">
                Please update your request based on these comments.
              </p>
            </Alert>
          )}
          <CardTitle tag="h5" className="text-center mb-4">
            {isEditMode
              ? "Update Biological Sample Shipment Request"
              : "Request For Biological Sample Shipment"}
          </CardTitle>
          <Form onSubmit={handleSubmit}>
            <Row className="form-row">
              <Col md={6}>
                <FormGroup>
                  <Label for="fullName">
                    User Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="fullName"
                    id="fullName"
                    value={requestFormData.fullName}
                    readOnly
                    required
                    className="form-input"
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="staffEmail">
                    Email <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="email"
                    name="staffEmail"
                    id="staffEmail"
                    value={requestFormData.staffEmail}
                    readOnly
                    required
                    className="form-input"
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row form>
              <Col md={6}>
                <FormGroup>
                  <Label for="chargeCode">Charge Code</Label>
                  <Select
                    name="chargeCode"
                    id="chargeCode"
                    value={budgetCodes.find(
                      (code) => code.value === requestFormData.chargeCode
                    )}
                    onChange={handleBudgetCodeChange}
                    options={budgetCodes}
                    className={validationErrors.chargeCode ? "is-invalid" : ""}
                  />
                  {renderErrorMessage("chargeCode")}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="projectName">Project Name</Label>
                  <Input
                    type="text"
                    name="projectName"
                    id="projectName"
                    value={requestFormData.projectName}
                    readOnly
                    invalid={!!validationErrors.projectName}
                    style={{ backgroundColor: "#e9ecef" }}
                  />
                  {renderErrorMessage("projectName")}
                </FormGroup>
              </Col>
            </Row>
            <Row form>
              <Col md={6}>
                <FormGroup>
                  <Label for="sccLeo">SCC/Leo:</Label>
                  <Input
                    type="text"
                    name="sccLeo"
                    id="sccLeo"
                    value={requestFormData.sccLeo}
                    onChange={(e) => handleChange("sccLeo", e.target.value)}
                    invalid={!!validationErrors.sccLeo}
                  />
                  {renderErrorMessage("sccLeo")}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="projectPIMRCG">Project PI MRCG (username):</Label>
                  <Select
                    name="projectPIMRCG"
                    id="projectPIMRCG"
                    value={users.find(
                      (user) => user.value === requestFormData.projectPIMRCG
                    )}
                    onChange={(selected) =>
                      handleChange("projectPIMRCG", selected.value)
                    }
                    options={users}
                    isSearchable
                    placeholder="Select Project PI"
                    className={
                      validationErrors.projectPIMRCG ? "is-invalid" : ""
                    }
                  />
                  {renderErrorMessage("projectPIMRCG")}
                </FormGroup>
              </Col>
            </Row>
            <Row form>
              <Col md={12}>
                <FormGroup>
                  <Label for="shipmentModes">Mode of Shipment</Label>
                  <Select
                    name="shipmentModes"
                    id="shipmentModes"
                    value={shipmentModes.filter((mode) =>
                      requestFormData.shipmentModes.includes(mode.value)
                    )}
                    onChange={handleShipmentModeChange}
                    options={shipmentModes}
                    isMulti
                    className={
                      validationErrors.shipmentModes ? "is-invalid" : ""
                    }
                  />
                  {renderErrorMessage("shipmentModes")}
                </FormGroup>
              </Col>
            </Row>

            <Row form>
              <Col md={12}>
                <div
                  style={{
                    borderLeft: "2px solid #ccc",
                    borderRight: "2px solid #ccc",
                    borderBottom: "2px solid #ccc",
                    paddingLeft: "10px",
                    paddingRight: "10px",
                    marginBottom: "16px",
                  }}
                >
                  <h3
                    style={{
                      borderBottom: "2px solid #ccc",
                      marginBottom: "15px",
                      marginTop: "5px",
                      fontWeight: "bold",
                      color: "#333",
                      textTransform: "uppercase",
                      fontSize: "1.2rem",
                    }}
                  >
                    Sample Destination
                  </h3>
                  <FormGroup>
                    <Label for="consigneeName">Consignee Name</Label>
                    <Input
                      type="text"
                      name="consigneeName"
                      id="consigneeName"
                      value={requestFormData.consigneeName}
                      onChange={(e) =>
                        handleChange("consigneeName", e.target.value)
                      }
                      invalid={!!validationErrors.consigneeName}
                    />
                    {renderErrorMessage("consigneeName")}
                  </FormGroup>
                  <FormGroup>
                    <Label for="consigneeEmail">Consignee Email</Label>
                    <Input
                      type="email"
                      name="consigneeEmail"
                      id="consigneeEmail"
                      value={requestFormData.consigneeEmail}
                      onChange={(e) =>
                        handleChange("consigneeEmail", e.target.value)
                      }
                      invalid={!!validationErrors.consigneeEmail}
                    />
                    {renderErrorMessage("consigneeEmail")}
                  </FormGroup>
                  <FormGroup>
                    <Label for="country">Country</Label>
                    <Select
                      name="country"
                      id="country"
                      value={countries.find(
                        (c) => c.value === requestFormData.country
                      )}
                      onChange={(selected) =>
                        handleChange("country", selected.value)
                      }
                      options={countries}
                      isSearchable
                      className={validationErrors.country ? "is-invalid" : ""}
                    />
                    {renderErrorMessage("country")}
                  </FormGroup>
                  <FormGroup>
                    <Label for="address">Address</Label>
                    <Input
                      type="textarea"
                      name="address"
                      id="address"
                      value={requestFormData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      invalid={!!validationErrors.address}
                      style={{ minHeight: "120px" }}
                    />
                    {renderErrorMessage("address")}
                  </FormGroup>
                  <FormGroup>
                    <Label for="tel">Tel:</Label>
                    <Input
                      type="tel"
                      name="tel"
                      id="tel"
                      value={requestFormData.tel}
                      onChange={(e) => handleChange("tel", e.target.value)}
                      invalid={!!validationErrors.tel}
                    />
                    {renderErrorMessage("tel")}
                  </FormGroup>
                </div>
              </Col>
            </Row>

            <div className="accordion-container">
              <Button
                color={
                  validationErrors.sampleDescription ? "danger" : "secondary"
                }
                block
                onClick={() => setCollapse1(!collapse1)}
                className="mb-3"
              >
                {collapse1 ? (
                  <>
                    Hide Sample Descriptions{" "}
                    <FontAwesomeIcon icon={faAngleUp} />
                  </>
                ) : (
                  <>
                    Show Sample Descriptions{" "}
                    <FontAwesomeIcon icon={faAngleDown} />
                  </>
                )}
              </Button>
              <Collapse isOpen={collapse1}>
                <div className="border p-3">
                  <FormGroup>
                    <ExcelUploadGuide />
                    <Label for="excelUpload">
                      Upload Excel File (Optional)
                    </Label>
                    <Input
                      type="file"
                      name="excelUpload"
                      id="excelUpload"
                      onChange={handleExcelUpload}
                      accept=".xlsx, .xls"
                    />
                  </FormGroup>

                  {excelData.length > 0 ? (
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Sample Type</th>
                          <th>Container Type</th>
                          <th>Box ID</th>
                          <th>Total Number</th>
                          <th>Total Volume (ml)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.map((row, index) => (
                          <tr key={index}>
                            <td>{row.sampleType}</td>
                            <td>{row.containerType}</td>
                            <td>{row.boxID}</td>
                            <td>{row.totalNumber}</td>
                            <td>{row.totalVolume}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    requestFormData.sampleDescription.map((desc, index) => (
                      <Row key={index} className="mb-3 align-items-end">
                        <Col md={3}>
                          <FormGroup>
                            <Label
                              for={`sampleType${index}`}
                              style={{
                                fontWeight: "bold",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Sample Type
                            </Label>
                            <Input
                              type="text"
                              id={`sampleType${index}`}
                              value={desc.sampleType}
                              onChange={(e) =>
                                handleArrayChange(
                                  "sampleDescription",
                                  index,
                                  "sampleType",
                                  e.target.value
                                )
                              }
                              invalid={
                                validationErrors.sampleDescription &&
                                !desc.sampleType
                              }
                            />
                          </FormGroup>
                        </Col>
                        <Col md={3}>
                          <FormGroup>
                            <Label
                              for={`containerType${index}`}
                              style={{
                                fontWeight: "bold",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Container Type
                            </Label>
                            <Select
                              id={`containerType${index}`}
                              options={containerTypes}
                              value={containerTypes.find(
                                (option) =>
                                  option.value === containerType[index]
                              )}
                              onChange={(selectedOption) =>
                                handleContainerTypeChange(selectedOption, index)
                              }
                              className={
                                validationErrors.sampleDescription &&
                                !desc.containerType
                                  ? "is-invalid"
                                  : ""
                              }
                            />
                            {containerType[index] === "Others" && (
                              <Input
                                type="text"
                                id={`customContainerType${index}`}
                                value={customContainerType[index]}
                                onChange={(e) => {
                                  const updatedCustomTypes = [
                                    ...customContainerType,
                                  ];
                                  updatedCustomTypes[index] = e.target.value;
                                  setCustomContainerType(updatedCustomTypes);
                                }}
                                placeholder="Specify container type"
                                style={{ marginTop: "10px" }}
                              />
                            )}
                          </FormGroup>
                        </Col>
                        <Col md={2}>
                          <FormGroup>
                            <Label
                              for={`boxID${index}`}
                              style={{
                                fontWeight: "bold",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Box (bag) ID
                            </Label>
                            <Input
                              type="text"
                              id={`boxID${index}`}
                              value={desc.boxID}
                              onChange={(e) =>
                                handleArrayChange(
                                  "sampleDescription",
                                  index,
                                  "boxID",
                                  e.target.value
                                )
                              }
                              invalid={
                                validationErrors.sampleDescription &&
                                !desc.boxID
                              }
                            />
                          </FormGroup>
                        </Col>
                        <Col md={2}>
                          <FormGroup>
                            <Label
                              for={`totalNumber${index}`}
                              style={{
                                fontWeight: "bold",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Number of samples
                            </Label>
                            <Input
                              type="number"
                              id={`totalNumber${index}`}
                              value={desc.totalNumber}
                              onChange={(e) =>
                                handleArrayChange(
                                  "sampleDescription",
                                  index,
                                  "totalNumber",
                                  e.target.value
                                )
                              }
                              invalid={
                                validationErrors.sampleDescription &&
                                !desc.totalNumber
                              }
                            />
                          </FormGroup>
                        </Col>
                        <Col md={2}>
                          <FormGroup>
                            <Label
                              for={`totalVolume${index}`}
                              style={{
                                fontWeight: "bold",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Total Volume (ml)
                            </Label>
                            <Input
                              type="number"
                              id={`totalVolume${index}`}
                              value={desc.totalVolume}
                              onChange={(e) =>
                                handleArrayChange(
                                  "sampleDescription",
                                  index,
                                  "totalVolume",
                                  e.target.value
                                )
                              }
                              invalid={
                                validationErrors.sampleDescription &&
                                !desc.totalVolume
                              }
                            />
                          </FormGroup>
                        </Col>
                        <Col md={2}>
                          <Button
                            color="danger"
                            onClick={() =>
                              handleRemoveField("sampleDescription", index)
                            }
                          >
                            Remove
                          </Button>
                        </Col>
                      </Row>
                    ))
                  )}
                  {excelData.length === 0 && (
                    <Button
                      color="info"
                      onClick={() => handleAddField("sampleDescription")}
                      block
                    >
                      Add
                    </Button>
                  )}
                </div>
                {renderErrorMessage("sampleDescription")}
              </Collapse>
            </div>

            <Row form>
              <Col md={6}>
                <FormGroup>
                  <Label for="isHazardous">Is Material Hazardous?</Label>
                  <Select
                    name="isHazardous"
                    id="isHazardous"
                    value={
                      requestFormData.isHazardous !== ""
                        ? {
                            value: requestFormData.isHazardous,
                            label: requestFormData.isHazardous ? "Yes" : "No",
                          }
                        : null
                    }
                    onChange={(selectedOption) =>
                      handleChange("isHazardous", selectedOption.value)
                    }
                    options={[
                      { value: true, label: "Yes" },
                      { value: false, label: "No" },
                    ]}
                    className={validationErrors.isHazardous ? "is-invalid" : ""}
                  />
                  {renderErrorMessage("isHazardous")}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="hasMTA">Do you have MTA?</Label>
                  <Select
                    name="hasMTA"
                    id="hasMTA"
                    value={
                      requestFormData.hasMTA !== ""
                        ? {
                            value: requestFormData.hasMTA,
                            label: requestFormData.hasMTA ? "Yes" : "No",
                          }
                        : null
                    }
                    onChange={(selectedOption) =>
                      handleChange("hasMTA", selectedOption.value)
                    }
                    options={[
                      { value: true, label: "Yes" },
                      { value: false, label: "No" },
                    ]}
                    className={validationErrors.hasMTA ? "is-invalid" : ""}
                  />
                  {renderErrorMessage("hasMTA")}
                </FormGroup>
              </Col>
            </Row>

            <FormGroup>
              <Label for="purpose">Purpose of Sending Sample</Label>
              <Input
                type="text"
                name="purpose"
                id="purpose"
                value={requestFormData.purpose}
                onChange={(e) => handleChange("purpose", e.target.value)}
                invalid={!!validationErrors.purpose}
              />
              {renderErrorMessage("purpose")}
            </FormGroup>

            <Card className="mt-4 border-primary">
              <CardBody>
                <CardTitle tag="h5" className="text-primary mb-4">
                  <FontAwesomeIcon icon={faCheckSquare} className="mr-2" />
                  Transfer of Biological Samples Guarantee & Ledger Entry
                </CardTitle>
                <p className="text-muted mb-3">
                  Please tick (✓) or mark Not Applicable (NA) as appropriate:
                </p>
                <Row>
                  {[
                    {
                      key: "aliquotsLeft",
                      label:
                        "Aliquots of the sample, appropriately labelled, have been left in The Gambia together with relevant documentation.",
                    },
                    {
                      key: "noThirdParty",
                      label:
                        "These samples will not be passed on in whole or in part to a third party without permission from The Gambia Government/MRC Ethical Committee.",
                    },
                    {
                      key: "aidsApproval",
                      label:
                        "The approval of the National AIDS Committee has been obtained for the transfer of any samples relating to AIDS patients or AIDS research.",
                    },
                    {
                      key: "purposeOnly",
                      label:
                        "The samples will not be used for any other purpose other than for which approval was given.",
                    },
                  ].map((item, index) => (
                    <Col md={6} key={item.key}>
                      <FormGroup check className="mb-3">
                        <Label check className="d-flex align-items-center">
                          <Input
                            type="checkbox"
                            checked={transferGuarantee[item.key]}
                            onChange={handleTransferGuaranteeChange(item.key)}
                            className="mr-2"
                          />
                          <span>{item.label}</span>
                        </Label>
                      </FormGroup>
                    </Col>
                  ))}
                </Row>
              </CardBody>
            </Card>

            <Card className="mt-4 border-success">
              <CardBody>
                <FormGroup check className="mb-0">
                  <Label check className="d-flex align-items-center">
                    <Input
                      type="checkbox"
                      checked={declaration}
                      onChange={(e) => {
                        setDeclaration(e.target.checked);
                        setValidationErrors((prev) => ({
                          ...prev,
                          declaration: null,
                        }));
                      }}
                      className={`mr-2 ${
                        validationErrors.declaration ? "is-invalid" : ""
                      }`}
                    />
                    <span className="font-weight-bold text-success">
                      I declare that the above information is true and correct
                      to the best of my knowledge.
                    </span>
                  </Label>
                </FormGroup>
                {renderErrorMessage("declaration")}
              </CardBody>
            </Card>

            <Button
              className="mt-4"
              type="submit"
              color="primary"
              disabled={isLoading}
              block
            >
              {isLoading
                ? isEditMode
                  ? "Updating..."
                  : "Submitting..."
                : isEditMode
                ? "Update Request"
                : "Submit"}
            </Button> 
          </Form>
        </CardBody>
      </Card>
    </div>
  );
};

export default RequestForm;
