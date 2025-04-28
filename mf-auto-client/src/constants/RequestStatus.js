// Create a new file: src/constants/RequestStatus.js
export const RequestStatus = {
    PENDING_REVIEW: 1,
    AWAITING_AGENT: 2,
    AWAITING_CHECKLIST: 3,
    SHIPPED: 4
}
  
  export const StatusLabels = {
    [RequestStatus.PENDING_REVIEW]: "Pending Review",
    [RequestStatus.AWAITING_AGENT]: "Awaiting Agent",
    [RequestStatus.AWAITING_CHECKLIST]: "Awaiting Checklist",
    [RequestStatus.SHIPPED]: "Shipped",
  };