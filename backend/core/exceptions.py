"""
Custom exception classes.
"""
from rest_framework.exceptions import APIException
from rest_framework import status


class ConflictException(APIException):
    """409 Conflict - resource already exists or state conflict."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Resource conflict.'
    default_code = 'conflict'


class BusinessLogicException(APIException):
    """400 Bad Request - business logic violation."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Business logic error.'
    default_code = 'business_logic_error'
