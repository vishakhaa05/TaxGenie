import {
  countUserCustomers,
  createCustomer,
  listUserCustomers,
  findCustomerByIdAndUser,
  updateCustomerByIdAndUser,
  deleteCustomerByIdAndUser,
} from "../utils/localStore";

export class CustomerService {
  public static async listCustomers(userId: string, q?: string) {
    return await listUserCustomers(userId, q);
  }

  public static async getCustomer(userId: string, id: string) {
    const customer = await findCustomerByIdAndUser(id, userId);
    if (!customer) {
      const err: any = new Error("Customer not found");
      err.statusCode = 404;
      err.code = "CUSTOMER_NOT_FOUND";
      throw err;
    }
    return customer;
  }

  public static async createCustomer(userId: string, data: any) {
    const count = await countUserCustomers(userId);
    if (count >= 500) {
      const err: any = new Error("Customer limit reached (maximum 500)");
      err.statusCode = 400;
      err.code = "LIMIT_REACHED";
      throw err;
    }

    return await createCustomer(userId, data);
  }

  public static async updateCustomer(userId: string, id: string, data: any) {
    const updated = await updateCustomerByIdAndUser(id, userId, data);
    if (!updated) {
      const err: any = new Error("Customer not found");
      err.statusCode = 404;
      err.code = "CUSTOMER_NOT_FOUND";
      throw err;
    }
    return updated;
  }

  public static async deleteCustomer(userId: string, id: string) {
    const deleted = await deleteCustomerByIdAndUser(id, userId);
    if (!deleted) {
      const err: any = new Error("Customer not found");
      err.statusCode = 404;
      err.code = "CUSTOMER_NOT_FOUND";
      throw err;
    }
    return true;
  }
}
