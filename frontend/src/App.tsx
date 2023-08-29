import "./App.css";
//import FileBrowser from "./components/FileBrowser/FileBrowser";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ProfilePage from "./pages/profile";
import HomePage from "./pages/home";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { Provider } from "react-redux";
import { store } from "./state/store.ts";
import React from "react";

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
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Provider>
      </Auth0Provider>
    </Router>
  );
}

export default App;
