import pytest

from services.asr import get_pab_beneficiary_by_nric


@pytest.mark.asyncio
async def test_get_pab_beneficiary_live():
    nric = "S5021789F"

    result = await get_pab_beneficiary_by_nric(nric)

    assert result is not None, f"No beneficiary found for NRIC {nric}"
    assert result["nric"] == nric
