import React from "react";
import auth0mockable from "../auth0mockable";

const LoginButton = () => {
  const { loginWithRedirect } = auth0mockable.useAuth0();

  return <button onClick={() => loginWithRedirect()}>Log In</button>;
};

export default LoginButton;
