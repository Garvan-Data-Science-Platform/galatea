import { useAuth0 } from "@auth0/auth0-react";
//This is a workaround to make auth0 mockable in cypress

const e = window.Cypress
  ? () => {
      return {
        getAccessTokenSilently: async () => {
          console.log("MOCK ACCESS TOKEN");
          return "abc";
        },
        user: {
          name: "Test user",
          email: "testuser@garvan.org.au",
          picture: "none",
          loginWithRedirect: () => {},
        },
        isAuthenticated: true,
        isLoading: false,
      };
    }
  : useAuth0;

export default { useAuth0: e };
