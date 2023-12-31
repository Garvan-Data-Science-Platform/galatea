import "./App.css";
//import FileBrowser from "./components/FileBrowser/FileBrowser";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ProfilePage from "./pages/profile";
import HomePage from "./pages/home";
import LoginPage from "./pages/login";
import { Auth0Provider, withAuthenticationRequired } from "@auth0/auth0-react";
import { Provider } from "react-redux";
import { store } from "./state/store.ts";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import { createContext } from "react";

function App() {
  return (
    <Router>
      <Auth0Provider
        domain="dev-xedas2iasb2dv6bb.us.auth0.com"
        clientId="q1355w8Tk2hrQDJYZFradQvw4g9GIHfu"
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: "https://galatea-backend/",
        }}
      >
        <Provider store={store}>
          <ThemeProvider theme={theme}>
            <Routes>
              <Route
                path="/"
                element={<AuthenticationGuard component={HomePage} />}
              />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </ThemeProvider>
        </Provider>
      </Auth0Provider>
    </Router>
  );
}

const AuthenticationGuard = ({ component }: any) => {
  const Component = window.Cypress
    ? component
    : withAuthenticationRequired(component);
  return <Component />;
};

export default App;
