import { doRequest } from "../http";

export const adminService = {
  fetchAdminAddress: async () => await doRequest(`/v1/admin/address`),
};
