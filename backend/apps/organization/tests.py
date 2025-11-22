"""
Tests for organization app.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.organization.models import Department, Position

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user():
    return User.objects.create_user(
        email='test@example.com',
        password='testpass123',
        first_name='Иван',
        last_name='Петров',
    )


@pytest.fixture
def admin_user():
    return User.objects.create_superuser(
        email='admin@example.com',
        password='adminpass123',
        first_name='Admin',
        last_name='User',
    )


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def department(admin_user):
    return Department.objects.create(
        name='Отдел разработки',
        description='Разработка ПО',
        head=admin_user,
        order=1,
    )


@pytest.fixture
def position():
    return Position.objects.create(
        name='Разработчик',
        level=5,
    )


@pytest.mark.django_db
class TestDepartmentModel:
    """Tests for Department model."""

    def test_create_department(self, admin_user):
        """Test creating a department."""
        dept = Department.objects.create(
            name='Тестовый отдел',
            description='Описание',
        )
        assert dept.name == 'Тестовый отдел'

    def test_department_str(self, department):
        """Test department string representation."""
        assert department.name in str(department)

    def test_department_hierarchy(self, admin_user):
        """Test department hierarchy."""
        parent = Department.objects.create(
            name='Руководство',
            order=1,
        )
        child = Department.objects.create(
            name='IT отдел',
            parent=parent,
            order=2,
        )
        assert child.parent == parent
        assert child in parent.children.all()

    def test_department_ordering(self, admin_user):
        """Test departments are ordered correctly."""
        dept1 = Department.objects.create(name='Б отдел', order=2)
        dept2 = Department.objects.create(name='А отдел', order=1)
        depts = list(Department.objects.all())
        assert depts[0].order <= depts[-1].order


@pytest.mark.django_db
class TestPositionModel:
    """Tests for Position model."""

    def test_create_position(self):
        """Test creating a position."""
        pos = Position.objects.create(
            name='Тестовая должность',
            level=3,
        )
        assert pos.name == 'Тестовая должность'
        assert pos.level == 3

    def test_position_str(self, position):
        """Test position string representation."""
        assert position.name in str(position)

    def test_position_ordering(self):
        """Test positions are ordered by level."""
        Position.objects.create(name='Директор', level=1)
        Position.objects.create(name='Менеджер', level=3)
        Position.objects.create(name='Специалист', level=5)
        positions = list(Position.objects.all())
        assert positions[0].level <= positions[-1].level


@pytest.mark.django_db
class TestDepartmentsAPI:
    """Tests for departments API endpoints."""

    def test_list_departments(self, authenticated_client, department):
        """Test listing departments."""
        response = authenticated_client.get('/api/v1/organization/departments/')
        assert response.status_code == status.HTTP_200_OK

    def test_get_department_detail(self, authenticated_client, department):
        """Test getting department detail."""
        response = authenticated_client.get(
            f'/api/v1/organization/departments/{department.id}/'
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == department.name

    def test_create_department_admin_only(self, authenticated_client, admin_client):
        """Test only admin can create departments."""
        # Regular user should fail
        response = authenticated_client.post('/api/v1/organization/departments/', {
            'name': 'Новый отдел',
            'description': 'Описание',
        })
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_401_UNAUTHORIZED
        ]

        # Admin should succeed
        response = admin_client.post('/api/v1/organization/departments/', {
            'name': 'Новый отдел',
            'description': 'Описание',
        })
        assert response.status_code == status.HTTP_201_CREATED

    def test_update_department_admin_only(self, authenticated_client, admin_client, department):
        """Test only admin can update departments."""
        # Regular user should fail
        response = authenticated_client.patch(
            f'/api/v1/organization/departments/{department.id}/',
            {'name': 'Изменённое имя'}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Admin should succeed
        response = admin_client.patch(
            f'/api/v1/organization/departments/{department.id}/',
            {'name': 'Изменённое имя'}
        )
        assert response.status_code == status.HTTP_200_OK

    def test_delete_department_admin_only(self, admin_client):
        """Test only admin can delete departments."""
        dept = Department.objects.create(name='Удаляемый отдел')
        response = admin_client.delete(
            f'/api/v1/organization/departments/{dept.id}/'
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.django_db
class TestPositionsAPI:
    """Tests for positions API endpoints."""

    def test_list_positions(self, authenticated_client, position):
        """Test listing positions."""
        response = authenticated_client.get('/api/v1/organization/positions/')
        assert response.status_code == status.HTTP_200_OK

    def test_get_position_detail(self, authenticated_client, position):
        """Test getting position detail."""
        response = authenticated_client.get(
            f'/api/v1/organization/positions/{position.id}/'
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == position.name

    def test_create_position_admin_only(self, authenticated_client, admin_client):
        """Test only admin can create positions."""
        # Regular user should fail
        response = authenticated_client.post('/api/v1/organization/positions/', {
            'name': 'Новая должность',
            'level': 4,
        })
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_401_UNAUTHORIZED
        ]

        # Admin should succeed
        response = admin_client.post('/api/v1/organization/positions/', {
            'name': 'Новая должность',
            'level': 4,
        })
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestOrganizationTree:
    """Tests for organization tree endpoint."""

    def test_get_organization_tree(self, authenticated_client, admin_user):
        """Test getting organization tree."""
        # Create hierarchy
        parent = Department.objects.create(name='Руководство', order=1)
        Department.objects.create(name='IT', parent=parent, order=2)
        Department.objects.create(name='HR', parent=parent, order=3)

        response = authenticated_client.get('/api/v1/organization/tree/')
        assert response.status_code == status.HTTP_200_OK
