const HTTP_METHOD = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
  OPTIONS: "OPTIONS",
};

const HTTP_STATUS = {
  HTTP_200_OK: 200,
  HTTP_201_CREATED: 201,
  HTTP_400_BAD_REQUEST: 400,
  HTTP_401_UNAUTHORIZED: 401,
  HTTP_402_PAYMENT_REQUIRED: 402,
  HTTP_403_FORBIDDEN: 403,
  HTTP_404_NOT_FOUND: 404,
  HTTP_405_METHOD_NOT_ALLOWED: 405,
  HTTP_406_NOT_ACCEPTABLE: 406,
  HTTP_413_REQUEST_ENTITY_TOO_LARGE: 413,
};

/**
 *
 * @param {*} method = string
 * @param {*} headerOptions = {[key]: [value]}
 * @param {*} body = {[key]: [value]}
 * @returns
 */
const doRequest = async (
  url,
  method = HTTP_STATUS.GET,
  body,
  headers,
  options
) => {
  // wait until firebase user is resolved: https://firebase.google.com/docs/auth/web/manage-users#web-modular-api
  const firebaseAuth = await new Promise((resolve, reject) => {
    onAuthStateChanged(auth, (user) => {
      resolve(user);
    });
  });

  const defaultHeaderOptions = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (firebaseAuth && !options?.skipAuth) {
    let token = await firebaseAuth.getIdToken();
    defaultHeaderOptions["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(apiURL + url, {
      method,
      headers: {
        ...defaultHeaderOptions,
        ...headers,
      },
      body: body ? JSON.stringify(body) : null,
    });

    switch (response.status) {
      case HTTP_STATUS.HTTP_413_REQUEST_ENTITY_TOO_LARGE:
        throw new ApiError(response.status, "Request too large");
    }
    let j = await response.json();
    if (response.status >= HTTP_STATUS.HTTP_400_BAD_REQUEST) {
      throw new ApiError(response.status, j.error.message);
    }
    return j;
  } catch (e) {
    console.log("CAUGHT ERROR:", e);
    throw e;
  }
};

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }

  toString() {
    return `${this.message}`;
  }
}

export { doRequest, HTTP_METHOD, HTTP_STATUS };
