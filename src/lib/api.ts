export const api = {
  login: async (
    email: string,
    password: string
  ): Promise<{ error: string; token?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email !== "hakimoto@gmail.com") {
          resolve({
            error: "E-mail ou senha errados!",
          });
        } else {
          resolve({
            error: "",
            token: "123",
          });
        }
      }, 1000);
    });
  },
  forgotPassword: async (
    email: string
  ): Promise<{ error: string; token?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ error: "" });
      }, 1000);
    });
  },
  redefinePassword: async (
    password: string,
    token: string
  ): Promise<{ error: string; token?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ error: "" });
      }, 1000);
    });
  },
};
