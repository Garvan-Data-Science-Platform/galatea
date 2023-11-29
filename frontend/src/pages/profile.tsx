import React from "react";
import LoginButton from "components/LoginButton";
import auth0mockable from "../auth0mockable";

const Profile = () => {
  const { user, isAuthenticated, isLoading } = auth0mockable.useAuth0();

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
