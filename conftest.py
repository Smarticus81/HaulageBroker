"""Root pytest configuration.

Three jobs, all needed to run the service unit tests without a database:

1. Make the Python services importable the way the code expects.
   ``services/`` holds hyphenated directories (``automations-svc``,
   ``business-plan-svc``, ...) but the code imports them as underscore
   packages (``from automations_svc.engine import ...``), the same way the
   api-gateway imports ``llm_copilot_svc`` and ``billing_svc``.  ``shared`` is
   imported as a plain top-level package.  ``pytest.ini`` puts ``services/`` on
   ``sys.path``; the meta-path finder below maps ``foo_svc`` -> ``services/foo-svc``.

2. Let ``shared.database`` import when the asyncpg driver is not installed.
   Creating the async engine never connects, but SQLAlchemy does import the
   driver module, so a placeholder is registered when it is missing.

3. Work around the pytest-asyncio 0.23.0 + pytest 8.2 incompatibility, where
   the plugin touches ``collector.obj`` on ``Package`` collectors that no
   longer have it (fixed upstream in pytest-asyncio 0.23.6).  The wrapper is
   registered as a regular plugin (not a conftest hook) so it is present for
   every collector, including packages whose conftest chain is not loaded yet.
"""

from __future__ import annotations

import importlib.abc
import importlib.machinery
import importlib.util
import sys
import types
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent
SERVICES_DIR = ROOT / "services"

if str(SERVICES_DIR) not in sys.path:
    sys.path.insert(0, str(SERVICES_DIR))


class _HyphenatedServiceFinder(importlib.abc.MetaPathFinder):
    """Resolve ``foo_svc`` / ``api_gateway`` to ``services/foo-svc`` / ``services/api-gateway``."""

    def find_spec(self, fullname, path=None, target=None):
        if "." in fullname or "_" not in fullname:
            return None
        candidate = SERVICES_DIR / fullname.replace("_", "-")
        if not candidate.is_dir():
            return None
        init_py = candidate / "__init__.py"
        if init_py.is_file():
            return importlib.util.spec_from_file_location(
                fullname, init_py, submodule_search_locations=[str(candidate)]
            )
        spec = importlib.machinery.ModuleSpec(fullname, None, is_package=True)
        spec.submodule_search_locations = [str(candidate)]
        return spec


if not any(isinstance(f, _HyphenatedServiceFinder) for f in sys.meta_path):
    sys.meta_path.insert(0, _HyphenatedServiceFinder())


try:  # pragma: no cover - depends on the environment
    import asyncpg  # noqa: F401
except ImportError:  # pragma: no cover
    _asyncpg_stub = types.ModuleType("asyncpg")
    _asyncpg_stub.__doc__ = "Placeholder registered by conftest.py; unit tests never open a DB connection."
    sys.modules["asyncpg"] = _asyncpg_stub


class _AsyncioPackageCompat:
    """Swallow pytest-asyncio's Package.obj AttributeError on pytest >= 8.1."""

    @pytest.hookimpl(wrapper=True)
    def pytest_collectstart(self, collector):
        try:
            return (yield)
        except AttributeError:
            if isinstance(collector, pytest.Package):
                return None
            raise


def pytest_configure(config):
    name = "haulage_asyncio_package_compat"
    if not config.pluginmanager.has_plugin(name):
        config.pluginmanager.register(_AsyncioPackageCompat(), name)
