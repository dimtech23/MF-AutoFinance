import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import mrcgLogo from "../../src/assets/img/brand/mrcg_lshtm.png";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    borderBottom: 1,
    borderColor: "#008baa",
    paddingBottom: 4,
  },
  logo: {
    width: 120,
    height: "auto",
  },
  companyInfo: {
    width: "50%",
    textAlign: "right",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#008baa",
    textAlign: "center",
    marginBottom: 6,
  },
  invoiceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  table: {
    display: "table",
    width: "100%",
    borderStyle: "solid",
    borderColor: "#008baa",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCol: {
    width: "50%",
    borderStyle: "solid",
    borderColor: "#008baa",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: 2,
    fontSize: 9,
  },
  subTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 3,
    color: "#008baa",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#666",
    fontSize: 8,
    borderTop: 1,
    borderColor: "#008baa",
    paddingTop: 5,
  },
  price: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
    marginTop: 6,
  },
  productDescription: {
    marginTop: 4,
    marginBottom: 4,
  },
  totalSummaryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#008baa",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 4,
  }
});

const ShipmentAgreementPDF = ({ request, shipmentDetails }) => {
  // Handle data coming from different sources
  // When called from ShipperRequests, the data might be nested in request.request
  const actualRequest = request.id ? request : (request.request || request);
  
  console.log("PDF DATA:", {
    consigneeEmail: actualRequest.consigneeEmail,
    id: actualRequest.id,
  });
  
  const calculateTotalSummary = () => {
    const summary = {
      totalSampleCount: 0,
      totalOverpacks: 0,
      overpackTypes: new Set(),
      externalDimensions: new Set(),
      totalSampleVolume: 0,
      totalDryIce: 0,
      // totalIceDisplaced: 0,
      totalWeight: parseFloat(shipmentDetails.totalWeightKg) || 0,
    };

    if (shipmentDetails.overpackSummaries) {
      shipmentDetails.overpackSummaries.forEach((overpack) => {
        summary.totalSampleCount += overpack.sampleCount || 0;
        summary.totalOverpacks += overpack.totalOverpacks || 0;
        if (overpack.overpackType) summary.overpackTypes.add(overpack.overpackType);
        if (overpack.externalDimensions) summary.externalDimensions.add(overpack.externalDimensions);
        summary.totalDryIce += (overpack.dryIceUsed || 0) * (overpack.totalOverpacks || 1);
        // summary.totalIceDisplaced += (overpack.iceDisplaced || 0.6) * (overpack.totalOverpacks || 1);
      });
    }

    if (actualRequest.sampleDescriptions) {
      actualRequest.sampleDescriptions.forEach((sample) => {
        summary.totalSampleVolume += parseFloat(sample.totalVolume) || 0;
      });
    }

    return {
      totalWeight: `${summary.totalWeight.toFixed(2)} kg`,
      totalSampleCount: summary.totalSampleCount,
      totalOverpacks: summary.totalOverpacks,
      overpackTypes: Array.from(summary.overpackTypes).join(", "),
      externalDimensions: Array.from(summary.externalDimensions).join(", "),
      totalSampleVolume: `${summary.totalSampleVolume.toFixed(2)} ml`,
      totalDryIce: `${summary.totalDryIce.toFixed(2)} kg`,
      // totalIceDisplaced: `${summary.totalIceDisplaced.toFixed(2)}`,
    };
  };

  const totalSummary = calculateTotalSummary();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image style={styles.logo} src={mrcgLogo} />
          <View style={styles.companyInfo}>
            <Text>MRC Unit The Gambia</Text>
            <Text>Atlantic Boulevard, Fajara</Text>
            <Text>P.O. BOX 273, BANJUL</Text>
            <Text>THE GAMBIA, WEST AFRICA</Text>
            <Text>Tel: +2204495442 Ext: 1808</Text>
          </View>
        </View>

        <Text style={styles.title}>Customs Invoice</Text>

        <View style={styles.invoiceInfo}>
          <View>
            <Text style={styles.invoiceNumber}>
              Invoice Number: INV-{String(actualRequest.id).padStart(6, "0")}-
              {shipmentDetails.agent}
            </Text>
            <Text style={styles.requestNumber}>
              Request Number: REQ-{String(actualRequest.id).padStart(6, "0")}
            </Text>
          </View>
          <View>
            <Text>Date: {new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        <Text style={styles.subTitle}>Consignee Information</Text>
        <View style={styles.table}>
          {[
            { label: "Consignee Name", value: actualRequest.consigneeName },
            { 
              label: "Consignee Email", 
              value: actualRequest.consigneeEmail || ""
            },
            { label: "Address", value: actualRequest.address },
            { label: "Country", value: actualRequest.country || "" },
            { label: "Tel", value: actualRequest.tel },
          ].map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.label}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.subTitle}>Shipment Details</Text>
        <View style={styles.table}>
          {Object.entries(shipmentDetails)
            .filter(
              ([key]) =>
                key !== "overpackSummaries" &&
                key !== "agent" &&
                key !== "productDescription"
            )
            .map(([key, value], index) => (
              <View style={styles.tableRow} key={index}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{value}</Text>
                </View>
              </View>
            ))}
        </View>

        <Text style={styles.totalSummaryTitle}>Total Summary</Text>
        <View style={styles.table}>
          {Object.entries(totalSummary).map(([key, value], index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {key === "totalSampleCount"
                    ? "Total Box Count"
                    : key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.productDescription}>
          <Text style={styles.subTitle}>Product Description</Text>
          <Text>{shipmentDetails.productDescription}</Text>
        </View>

        <Text style={styles.price}>
          custom's value US $10.00
        </Text>

        <Text style={styles.footer}>
          This is a system-generated invoice. For inquiries, please contact our
          shipping department.
        </Text>
      </Page>
    </Document>
  );
};

export default ShipmentAgreementPDF;