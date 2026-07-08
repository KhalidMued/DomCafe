import asyncio


class FakeResult:
    def __init__(self, admin):
        self.admin = admin

    def scalar_one_or_none(self):
        return self.admin


class FakeSession:
    def __init__(self, admin=None):
        self.admin = admin

    async def execute(self, _statement):
        return FakeResult(self.admin)


def test_unknown_username_burns_a_dummy_password_check(monkeypatch):
    from app.services import admin_auth

    burned = {}
    monkeypatch.setattr(admin_auth, "burn_password_check", lambda password: burned.setdefault("password", password))

    result = asyncio.run(admin_auth.authenticate_admin(FakeSession(admin=None), "ghost", "secret"))

    assert result is None
    assert burned["password"] == "secret"


def test_known_username_does_not_burn_the_dummy_check(monkeypatch):
    from app.core.security import hash_password
    from app.services import admin_auth

    class Admin:
        id = 1
        password_hash = hash_password("right-password")

    monkeypatch.setattr(
        admin_auth, "burn_password_check", lambda _password: (_ for _ in ()).throw(AssertionError("burned"))
    )

    result = asyncio.run(admin_auth.authenticate_admin(FakeSession(admin=Admin()), "admin", "wrong-password"))

    assert result is None


def test_burn_password_check_reuses_one_cached_hash():
    from app.core import security

    security._timing_shield_hash = None
    security.burn_password_check("anything")
    first = security._timing_shield_hash
    assert first is not None

    security.burn_password_check("something-else")
    assert security._timing_shield_hash is first
