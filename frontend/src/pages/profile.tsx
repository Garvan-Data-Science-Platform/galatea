import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import LoginButton from "components/LoginButton";

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  return isAuthenticated ? (
    <div>
      <img src={user.picture} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  ) : (
    <>
      <p>Not Authenticated</p>
      <LoginButton />
    </>
  );
};

export default Profile;

//dev-xedas2iasb2dv6bb.us.auth0.com
//q1355w8Tk2hrQDJYZFradQvw4g9GIHfu
