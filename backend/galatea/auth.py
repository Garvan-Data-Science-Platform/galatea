from types import SimpleNamespace
from functools import wraps
from http import HTTPStatus
from typing import NamedTuple
import jwt
import os
from dotenv import load_dotenv
from django.http import HttpResponse, JsonResponse
from ninja.security import HttpBearer
from ninja.errors import AuthenticationError
from django.contrib.auth.models import User, Group
from django.contrib.auth import login

load_dotenv()

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")


def json_abort(status, message):
    raise AuthenticationError(status, message)


class Auth0Service:
    """Perform JSON Web Token (JWT) validation using PyJWT"""

    def __init__(self):
        self.issuer_url = f'https://{AUTH0_DOMAIN}/'
        self.audience = None
        self.algorithm = 'RS256'
        self.jwks_uri = f'{self.issuer_url}.well-known/jwks.json'
        self.audience = AUTH0_AUDIENCE

    def get_signing_key(self, token):
        try:
            jwks_client = jwt.PyJWKClient(self.jwks_uri)

            return jwks_client.get_signing_key_from_jwt(token).key
        except Exception as error:
            json_abort(HTTPStatus.INTERNAL_SERVER_ERROR, {
                "error": "signing_key_unavailable",
                "error_description": error.__str__(),
                "message": "Unable to verify credentials"
            })

    def validate_jwt(self, token):
        try:
            jwt_signing_key = self.get_signing_key(token)

            payload = jwt.decode(
                token,
                jwt_signing_key,
                algorithms=self.algorithm,
                audience=self.audience,
                issuer=self.issuer_url,
            )
        except Exception as error:
            json_abort(HTTPStatus.UNAUTHORIZED, {
                "error": "invalid_token",
                "error_description": error.__str__(),
                "message": "Bad credentials."
            })
            return

        return payload


auth0_service = Auth0Service()


class AuthBearer(HttpBearer):
    def authenticate(self, request, token):
        validated_token = auth0_service.validate_jwt(token)
        try:
            user = User.objects.get(email=validated_token["email"])
        except User.DoesNotExist:
            user = User(username=validated_token["email"], email=validated_token["email"])
            user.save()
            if validated_token['email'].split('@')[-1] == 'garvan.org.au':
                grp = Group.objects.get(name="Garvan users")
                user.groups.add(grp)
                user.save()
        login(request, user)
        return validated_token


unauthorized_error = {
    "message": "Requires authentication"
}

invalid_request_error = {
    "error": "invalid_request",
    "error_description": "Authorization header value must follow this format: Bearer access-token",
    "message": "Requires authentication"
}
