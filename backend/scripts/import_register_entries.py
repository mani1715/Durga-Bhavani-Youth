"""
Seed and Repeat-safe import script for Garuvupalem Dasara festival register entries.
Maps 10 handwritten committee-register pages (11 October to 20 October 2026)
into the day_offerings table across 6 discrete sections:
- MORNING_PUJA
- MORNING_PRASADAM
- EVENING_PUJA
- EVENING_PRASADAM
- LUCKY_DIP
- SPECIAL_PROGRAMME

Guarantees:
1. Zero modifications to financial ledger (receipts, expenses, donations).
2. Preserves Day 0 (10 Oct arrival) and Day 11 (21 Oct conclusion).
3. Daily Morning Prasadam for Days 1..10 is assigned to Suragani Venkatavaraprasad Anjaneyulu garla dampathulu
   with review_status='NEEDS_REVIEW' and audit log recorded.
4. Completely idempotent via unique source_reference tags.
"""

import sys
import os
import uuid
from datetime import datetime

# Adjust path so script can run from anywhere
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.db_models import FestivalDay, DayOffering, AuditLog

MORNING_PRASADAM_EN = "Suragani Venkatavaraprasad Anjaneyulu garla dampathulu"
MORNING_PRASADAM_TE = "సూరగాని వెంకటవరప్రసాద్ ఆంజనేయులు గార్ల దంపతులు"

REGISTER_DATA = [
    # ----------------------------------------------------
    # Day 1: 11 October 2026
    # ----------------------------------------------------
    {
        "date": "2026-10-11",
        "day_number": 1,
        "offerings": [
            {
                "source_ref": "REG_2026_DAY1_M_PRASADAM",
                "offering_type": "MORNING_PRASADAM",
                "session": "MORNING",
                "sponsor_name": MORNING_PRASADAM_EN,
                "sponsor_name_telugu": MORNING_PRASADAM_TE,
                "item_description": "Daily Morning Prasadam",
                "item_description_telugu": "ఉదయం నిత్య ప్రసాద వితరణ",
                "review_status": "NEEDS_REVIEW",
                "notes": "Daily morning prasadam assigned per latest committee instruction. Note: Register mentioned Suragani Lakshmi Tirupatamma dampathulu.",
                "notes_telugu": "తాజా కమిటీ సూచన మేరకు ఉదయం ప్రసాద దాతగా నిర్ణయించడమైనది. (రిజిస్టరులో సూరగాని లక్ష్మీ తిరుపతమ్మ దంపతులు అని పేర్కొనబడింది).",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY1_M_PUJA_1",
                "offering_type": "MORNING_PUJA",
                "session": "MORNING",
                "sponsor_name": "Suragani Lakshmi Tirupatamma dampathulu",
                "sponsor_name_telugu": "సూరగాని లక్ష్మీ తిరుపతమ్మ దంపతులు",
                "item_description": "Morning Puja",
                "item_description_telugu": "ఉదయం పూజ",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY1_E_PUJA_1",
                "offering_type": "EVENING_PUJA",
                "session": "EVENING",
                "sponsor_name": "Suragani Lakshmi Tirupatamma dampathulu",
                "sponsor_name_telugu": "సూరగాని లక్ష్మీ తిరుపతమ్మ దంపతులు",
                "item_description": "Evening Puja",
                "item_description_telugu": "సాయంత్రం పూజ",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY1_E_PRASADAM_1",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Suragani Lakshmi Tirupatamma dampathulu",
                "sponsor_name_telugu": "సూరగాని లక్ష్మీ తిరుపతమ్మ దంపతులు",
                "item_description": "Evening Prasadam",
                "item_description_telugu": "సాయంత్రం ప్రసాద వితరణ",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY1_LUCKY_DIP_1",
                "offering_type": "LUCKY_DIP",
                "session": "EVENING",
                "sponsor_name": "Suragani Lakshmi Tirupatamma dampathulu",
                "sponsor_name_telugu": "సూరగాని లక్ష్మీ తిరుపతమ్మ దంపతులు",
                "item_description": "Sarees",
                "item_description_telugu": "చీరలు",
                "quantity": "11",
                "unit": "sarees",
                "unit_telugu": "చీరలు",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY1_LUCKY_DIP_2",
                "offering_type": "LUCKY_DIP",
                "session": "EVENING",
                "sponsor_name": "Suragani Sambasiva Rao garu, Bharati dampathulu",
                "sponsor_name_telugu": "సూరగాని సాంబశివరావు గారు, భారతి దంపతులు",
                "item_description": "Steel Plates",
                "item_description_telugu": "స్టీల్ ప్లేట్లు",
                "quantity": "21",
                "unit": "plates",
                "unit_telugu": "ప్లేట్లు",
                "review_status": "CONFIRMED",
                "display_order": 2
            }
        ]
    },
    # ----------------------------------------------------
    # Day 2: 12 October 2026
    # ----------------------------------------------------
    {
        "date": "2026-10-12",
        "day_number": 2,
        "offerings": [
            {
                "source_ref": "REG_2026_DAY2_M_PRASADAM",
                "offering_type": "MORNING_PRASADAM",
                "session": "MORNING",
                "sponsor_name": MORNING_PRASADAM_EN,
                "sponsor_name_telugu": MORNING_PRASADAM_TE,
                "item_description": "Daily Morning Prasadam",
                "item_description_telugu": "ఉదయం నిత్య ప్రసాద వితరణ",
                "review_status": "NEEDS_REVIEW",
                "notes": "Daily morning prasadam assigned per latest committee instruction.",
                "notes_telugu": "తాజా కమిటీ సూచన మేరకు ఉదయం ప్రసాద దాతగా నిర్ణయించడమైనది.",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY2_E_PUJA_1",
                "offering_type": "EVENING_PUJA",
                "session": "EVENING",
                "sponsor_name": "Suragani Srinivasa Rao garu, Sowmya gari dampathulu",
                "sponsor_name_telugu": "సూరగాని శ్రీనివాసరావు గారు, సౌమ్య గారి దంపతులు",
                "item_description": "Evening Puja",
                "item_description_telugu": "సాయంత్రం పూజ",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY2_E_PRASADAM_1",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Suragani Srinivasa Rao garu, Sowmya gari dampathulu",
                "sponsor_name_telugu": "సూరగాని శ్రీనివాసరావు గారు, సౌమ్య గారి దంపతులు",
                "item_description": "Evening Prasadam",
                "item_description_telugu": "సాయంత్రం ప్రసాద వితరణ",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY2_E_PRASADAM_2",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Durga Bhavani Youth Committee",
                "sponsor_name_telugu": "దుర్గాభవాని యూత్ కమిటీ",
                "item_description": "Evening Prasadam",
                "item_description_telugu": "సాయంత్రం ప్రసాద వితరణ",
                "review_status": "CONFIRMED",
                "display_order": 2
            },
            {
                "source_ref": "REG_2026_DAY2_LUCKY_DIP_1",
                "offering_type": "LUCKY_DIP",
                "session": "EVENING",
                "sponsor_name": "Rajamallu Anjaneyulu",
                "sponsor_name_telugu": "రాజమల్లు ఆంజనేయులు",
                "item_description": "Sarees",
                "item_description_telugu": "చీరలు",
                "quantity": "5",
                "unit": "sarees",
                "unit_telugu": "చీరలు",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY2_LUCKY_DIP_2",
                "offering_type": "LUCKY_DIP",
                "session": "EVENING",
                "sponsor_name": "Suragani Srinivasa Rao garu, Sowmya gari dampathulu",
                "sponsor_name_telugu": "సూరగాని శ్రీనివాసరావు గారు, సౌమ్య గారి దంపతులు",
                "item_description": "Sarees",
                "item_description_telugu": "చీరలు",
                "quantity": "5",
                "unit": "sarees",
                "unit_telugu": "చీరలు",
                "review_status": "CONFIRMED",
                "display_order": 2
            }
        ]
    },
    # ----------------------------------------------------
    # Day 3: 13 October 2026
    # ----------------------------------------------------
    {
        "date": "2026-10-13",
        "day_number": 3,
        "offerings": [
            {
                "source_ref": "REG_2026_DAY3_M_PRASADAM",
                "offering_type": "MORNING_PRASADAM",
                "session": "MORNING",
                "sponsor_name": MORNING_PRASADAM_EN,
                "sponsor_name_telugu": MORNING_PRASADAM_TE,
                "item_description": "Daily Morning Prasadam",
                "item_description_telugu": "ఉదయం నిత్య ప్రసాద వితరణ",
                "review_status": "NEEDS_REVIEW",
                "notes": "Daily morning prasadam assigned per latest committee instruction.",
                "notes_telugu": "తాజా కమిటీ సూచన మేరకు ఉదయం ప్రసాద దాతగా నిర్ణయించడమైనది.",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY3_E_PUJA_1",
                "offering_type": "EVENING_PUJA",
                "session": "EVENING",
                "sponsor_name": "Eluri Sai Sravan dampathulu",
                "sponsor_name_telugu": "ఏలూరి సాయి శ్రవణ్ దంపతులు",
                "item_description": "Evening Puja",
                "item_description_telugu": "సాయంత్రం పూజ",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY3_E_PRASADAM_1",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Eluri Sai Sravan dampathulu",
                "sponsor_name_telugu": "ఏలూరి సాయి శ్రవణ్ దంపతులు",
                "item_description": "Evening Prasadam",
                "item_description_telugu": "సాయంత్రం ప్రసాద వితరణ",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY3_E_PRASADAM_2",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Parabattula Bhuvaneswara Rao garu, Jhansi Lakshmi dampathulu (Muniratnam)",
                "sponsor_name_telugu": "పరబత్తుల భువనేశ్వరరావు గారు, ఝాన్సీ లక్ష్మి దంపతులు (మునిరత్నం)",
                "item_description": "Evening Prasadam",
                "item_description_telugu": "సాయంత్రం ప్రసాద వితరణ",
                "review_status": "CONFIRMED",
                "notes": "Muniratnam",
                "display_order": 2
            },
            {
                "source_ref": "REG_2026_DAY3_LUCKY_DIP_1",
                "offering_type": "LUCKY_DIP",
                "session": "EVENING",
                "sponsor_name": "GSSB Organization, Garuvupalem (Syamala)",
                "sponsor_name_telugu": "GSSB సంస్థ, గరువుపాలెం (శ్యామల)",
                "item_description": "Sarees",
                "item_description_telugu": "చీరలు",
                "quantity": "2",
                "unit": "sarees",
                "unit_telugu": "చీరలు",
                "review_status": "CONFIRMED",
                "display_order": 1
            }
        ]
    },
    # ----------------------------------------------------
    # Day 4: 14 October 2026
    # ----------------------------------------------------
    {
        "date": "2026-10-14",
        "day_number": 4,
        "offerings": [
            {
                "source_ref": "REG_2026_DAY4_M_PRASADAM",
                "offering_type": "MORNING_PRASADAM",
                "session": "MORNING",
                "sponsor_name": MORNING_PRASADAM_EN,
                "sponsor_name_telugu": MORNING_PRASADAM_TE,
                "item_description": "Daily Morning Prasadam",
                "item_description_telugu": "ఉదయం నిత్య ప్రసాద వితరణ",
                "review_status": "NEEDS_REVIEW",
                "notes": "Daily morning prasadam assigned per latest committee instruction.",
                "notes_telugu": "తాజా కమిటీ సూచన మేరకు ఉదయం ప్రసాద దాతగా నిర్ణయించడమైనది.",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY4_LUCKY_DIP_1",
                "offering_type": "LUCKY_DIP",
                "session": "EVENING",
                "sponsor_name": "Malladi Kishore Rao",
                "sponsor_name_telugu": "మల్లాది కిశోర్ రావు",
                "item_description": "Sarees",
                "item_description_telugu": "చీరలు",
                "quantity": "11",
                "unit": "sarees",
                "unit_telugu": "చీరలు",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY4_SPECIAL_PROG_1",
                "offering_type": "SPECIAL_PROGRAMME",
                "session": "AFTERNOON",
                "sponsor_name": "In memory of late Rayana Hariprasad garu, by Rayana Krishna Kumari garu",
                "sponsor_name_telugu": "స్వర్గీయ రాయన హరిప్రసాద్ గారి జ్ఞాపకార్థం రాయన కృష్ణకుమారి గారు",
                "item_description": "Afternoon Bhajan programme by Seshagiri Rao Bhajan Brindam, Chavali",
                "item_description_telugu": "మధ్యాహ్నం భజన కార్యక్రమం - శేషగిరిరావు భజన బృందం, చావలి",
                "review_status": "CONFIRMED",
                "display_order": 1
            }
        ]
    },
    # ----------------------------------------------------
    # Day 5: 15 October 2026
    # ----------------------------------------------------
    {
        "date": "2026-10-15",
        "day_number": 5,
        "offerings": [
            {
                "source_ref": "REG_2026_DAY5_M_PRASADAM",
                "offering_type": "MORNING_PRASADAM",
                "session": "MORNING",
                "sponsor_name": MORNING_PRASADAM_EN,
                "sponsor_name_telugu": MORNING_PRASADAM_TE,
                "item_description": "Daily Morning Prasadam",
                "item_description_telugu": "ఉదయం నిత్య ప్రసాద వితరణ",
                "review_status": "NEEDS_REVIEW",
                "notes": "Daily morning prasadam assigned per latest committee instruction.",
                "notes_telugu": "తాజా కమిటీ సూచన మేరకు ఉదయం ప్రసాద దాతగా నిర్ణయించడమైనది.",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY5_E_PUJA_1",
                "offering_type": "EVENING_PUJA",
                "session": "EVENING",
                "sponsor_name": "Burra Tirupatayya (Prasad), Ramana gari dampathulu",
                "sponsor_name_telugu": "బుర్రా తిరుపతయ్య (ప్రసాద్), రమణ గారి దంపతులు",
                "item_description": "Suvasini Pujala Karyakramamu",
                "item_description_telugu": "సువాసిని పూజల కార్యక్రమము",
                "notes": "Suvasini Pujala Karyakramamu",
                "notes_telugu": "సువాసిని పూజల కార్యక్రమము",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY5_E_PUJA_2",
                "offering_type": "EVENING_PUJA",
                "session": "EVENING",
                "sponsor_name": "Ittala (Srinivasa Rao) Bhuvaneswari dampathulu",
                "sponsor_name_telugu": "ఇత్తల (శ్రీనివాసరావు) భువనేశ్వరి దంపతులు",
                "item_description": "Evening Puja",
                "item_description_telugu": "సాయంత్రం పూజ",
                "review_status": "CONFIRMED",
                "display_order": 2
            },
            {
                "source_ref": "REG_2026_DAY5_E_PRASADAM_1",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Ittala (Srinivasa Rao) Bhuvaneswari dampathulu",
                "sponsor_name_telugu": "ఇత్తల (శ్రీనివాసరావు) భువనేశ్వరి దంపతులు",
                "item_description": "Chakkara Pongali",
                "item_description_telugu": "చక్కెర పొంగలి",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY5_E_PRASADAM_2",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Kala Lakshmayya, Parimala dampathulu",
                "sponsor_name_telugu": "కాల లక్ష్మయ్య, పరిమళ దంపతులు",
                "item_description": "Daddojanam",
                "item_description_telugu": "దద్దోజనం",
                "review_status": "CONFIRMED",
                "display_order": 2
            },
            {
                "source_ref": "REG_2026_DAY5_E_PRASADAM_3",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Committee",
                "sponsor_name_telugu": "కమిటీ",
                "item_description": "Guggillu",
                "item_description_telugu": "గుగ్గిళ్ళు",
                "review_status": "CONFIRMED",
                "display_order": 3
            },
            {
                "source_ref": "REG_2026_DAY5_LUCKY_DIP_1",
                "offering_type": "LUCKY_DIP",
                "session": "EVENING",
                "sponsor_name": "Kala Lakshmayya, Parimala dampathulu",
                "sponsor_name_telugu": "కాల లక్ష్మయ్య, పరిమళ దంపతులు",
                "item_description": "Sarees",
                "item_description_telugu": "చీరలు",
                "quantity": "21",
                "unit": "sarees",
                "unit_telugu": "చీరలు",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY5_LUCKY_DIP_2",
                "offering_type": "LUCKY_DIP",
                "session": "EVENING",
                "sponsor_name": "Pitla Nageswara Rao, Padma dampathulu",
                "sponsor_name_telugu": "పిట్లా నాగేశ్వరరావు, పద్మ దంపతులు",
                "item_description": "Water Vessels (Bindelu)",
                "item_description_telugu": "బిందెలు",
                "quantity": "5",
                "unit": "bindelu",
                "unit_telugu": "బిందెలు",
                "review_status": "CONFIRMED",
                "display_order": 2
            },
            {
                "source_ref": "REG_2026_DAY5_SPECIAL_PROG_1",
                "offering_type": "SPECIAL_PROGRAMME",
                "session": "EVENING",
                "sponsor_name": "Ponnuru Town Vice Chairman Sri Devarapalli Anil Kumar garu, Vadlamudi",
                "sponsor_name_telugu": "పొన్నూరు టౌన్ వైస్ ఛైర్మన్ శ్రీ దేవరపల్లి అనిల్ కుమార్ గారు, వడ్లమూడి",
                "item_description": "Natakam: Sri Lakshmi Tirupatamma Talli Katha Natakam",
                "item_description_telugu": "నాటకం: శ్రీ లక్ష్మీ తిరుపతమ్మ తల్లి కథ నాటకం",
                "review_status": "CONFIRMED",
                "display_order": 1
            }
        ]
    },
    # ----------------------------------------------------
    # Day 6: 16 October 2026 (Moola Nakshatram)
    # ----------------------------------------------------
    {
        "date": "2026-10-16",
        "day_number": 6,
        "offerings": [
            {
                "source_ref": "REG_2026_DAY6_M_PRASADAM",
                "offering_type": "MORNING_PRASADAM",
                "session": "MORNING",
                "sponsor_name": MORNING_PRASADAM_EN,
                "sponsor_name_telugu": MORNING_PRASADAM_TE,
                "item_description": "Daily Morning Prasadam",
                "item_description_telugu": "ఉదయం నిత్య ప్రసాద వితరణ",
                "review_status": "NEEDS_REVIEW",
                "notes": "Daily morning prasadam assigned per latest committee instruction.",
                "notes_telugu": "తాజా కమిటీ సూచన మేరకు ఉదయం ప్రసాద దాతగా నిర్ణయించడమైనది.",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY6_M_PUJA_1",
                "offering_type": "MORNING_PUJA",
                "session": "MORNING",
                "sponsor_name": "Rayana Sudheer Lakshmi Adilakshmi dampathulu",
                "sponsor_name_telugu": "రాయన సుధీర్ లక్ష్మి ఆదిలక్ష్మి దంపతులు",
                "item_description": "Morning Puja",
                "item_description_telugu": "ఉదయం పూజ",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY6_E_PUJA_1",
                "offering_type": "EVENING_PUJA",
                "session": "EVENING",
                "sponsor_name": "Santi Ratnakumar Maruthi Devi dampathulu",
                "sponsor_name_telugu": "శాంతి రత్నకుమార్ మారుతీదేవి దంపతులు",
                "item_description": "Evening Puja",
                "item_description_telugu": "సాయంత్రం పూజ",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY6_E_PUJA_2",
                "offering_type": "EVENING_PUJA",
                "session": "EVENING",
                "sponsor_name": "Katti Durga Prasad Lakshmi dampathulu (Penguduru)",
                "sponsor_name_telugu": "కట్టి దుర్గాప్రసాద్ లక్ష్మి దంపతులు (పెనుగూడూరు)",
                "item_description": "Evening Puja",
                "item_description_telugu": "సాయంత్రం పూజ",
                "review_status": "CONFIRMED",
                "display_order": 2
            },
            {
                "source_ref": "REG_2026_DAY6_E_PUJA_3",
                "offering_type": "EVENING_PUJA",
                "session": "EVENING",
                "sponsor_name": "Gouthu Srinivasa Rao Govindamma dampathulu",
                "sponsor_name_telugu": "గౌతు శ్రీనివాసరావు గోవిందమ్మ దంపతులు",
                "item_description": "Evening Puja",
                "item_description_telugu": "సాయంత్రం పూజ",
                "review_status": "CONFIRMED",
                "display_order": 3
            },
            {
                "source_ref": "REG_2026_DAY6_E_PUJA_4",
                "offering_type": "EVENING_PUJA",
                "session": "EVENING",
                "sponsor_name": "Rayana Sudheer Lakshmi Adilakshmi dampathulu",
                "sponsor_name_telugu": "రాయన సుధీర్ లక్ష్మి ఆదిలక్ష్మి దంపతులు",
                "item_description": "Evening Puja",
                "item_description_telugu": "సాయంత్రం పూజ",
                "review_status": "CONFIRMED",
                "display_order": 4
            },
            {
                "source_ref": "REG_2026_DAY6_E_PRASADAM_1",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Rayana Sudheer Lakshmi Adilakshmi dampathulu",
                "sponsor_name_telugu": "రాయన సుధీర్ లక్ష్మి ఆదిలక్ష్మి దంపతులు",
                "item_description": "Evening Prasadam",
                "item_description_telugu": "సాయంత్రం ప్రసాద వితరణ",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY6_E_PRASADAM_2",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Madlagattu Bhargavi Lakshmi Bhairav dampathulu",
                "sponsor_name_telugu": "మడ్లగట్టు భార్గవి లక్ష్మీ భైరవ్ దంపతులు",
                "item_description": "Evening Prasadam",
                "item_description_telugu": "సాయంత్రం ప్రసాద వితరణ",
                "review_status": "CONFIRMED",
                "display_order": 2
            },
            {
                "source_ref": "REG_2026_DAY6_E_PRASADAM_3",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Pasupula Rajasekhar Bhavani Praneethika",
                "sponsor_name_telugu": "పసుపుల రాజశేఖర్ భవాని ప్రణీతిక",
                "item_description": "Evening Prasadam",
                "item_description_telugu": "సాయంత్రం ప్రసాద వితరణ",
                "review_status": "CONFIRMED",
                "display_order": 3
            },
            {
                "source_ref": "REG_2026_DAY6_E_PRASADAM_4",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Badugu Sivaramaprasanna Prasad Sindhu dampathulu",
                "sponsor_name_telugu": "బడుగు శివరామప్రసన్న ప్రసాద్ సింధు దంపతులు",
                "item_description": "Garelu",
                "item_description_telugu": "గారెలు",
                "review_status": "CONFIRMED",
                "display_order": 4
            },
            {
                "source_ref": "REG_2026_DAY6_E_PRASADAM_5",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Santi Ratnakumar Maruthi Devi dampathulu",
                "sponsor_name_telugu": "శాంతి రత్నకుమార్ మారుతీదేవి దంపతులు",
                "item_description": "Evening Prasadam",
                "item_description_telugu": "సాయంత్రం ప్రసాద వితరణ",
                "review_status": "CONFIRMED",
                "display_order": 5
            },
            {
                "source_ref": "REG_2026_DAY6_E_PRASADAM_6",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Katti Durga Prasad Lakshmi dampathulu",
                "sponsor_name_telugu": "కట్టి దుర్గాప్రసాద్ లక్ష్మి దంపతులు",
                "item_description": "Evening Prasadam",
                "item_description_telugu": "సాయంత్రం ప్రసాద వితరణ",
                "review_status": "CONFIRMED",
                "display_order": 6
            },
            {
                "source_ref": "REG_2026_DAY6_LUCKY_DIP_1",
                "offering_type": "LUCKY_DIP",
                "session": "EVENING",
                "sponsor_name": "Suragani Ramanjaneyulu",
                "sponsor_name_telugu": "సూరగాని రామాంజనేయులు",
                "item_description": "Plates",
                "item_description_telugu": "ప్లేట్లు",
                "quantity": "25",
                "unit": "plates",
                "unit_telugu": "ప్లేట్లు",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY6_LUCKY_DIP_2",
                "offering_type": "LUCKY_DIP",
                "session": "EVENING",
                "sponsor_name": "Suragani Venkateswarlu Rangamma garla dampathulu",
                "sponsor_name_telugu": "సూరగాని వెంకటేశ్వర్లు రంగమ్మ గార్ల దంపతులు",
                "item_description": "Sarees",
                "item_description_telugu": "చీరలు",
                "quantity": "9",
                "unit": "sarees",
                "unit_telugu": "చీరలు",
                "review_status": "CONFIRMED",
                "display_order": 2
            },
            {
                "source_ref": "REG_2026_DAY6_LUCKY_DIP_3",
                "offering_type": "LUCKY_DIP",
                "session": "EVENING",
                "sponsor_name": "Uppala Nagababu garu",
                "sponsor_name_telugu": "ఉప్పాల నాగబాబు గారు",
                "item_description": "Sarees",
                "item_description_telugu": "చీరలు",
                "quantity": "5",
                "unit": "sarees",
                "unit_telugu": "చీరలు",
                "review_status": "CONFIRMED",
                "display_order": 3
            },
            {
                "source_ref": "REG_2026_DAY6_LUCKY_DIP_4",
                "offering_type": "LUCKY_DIP",
                "session": "EVENING",
                "sponsor_name": "Aluri Sitaramalakshmi",
                "sponsor_name_telugu": "ఆలూరి సీతారామలక్ష్మి",
                "item_description": "Sarees",
                "item_description_telugu": "చీరలు",
                "quantity": "5",
                "unit": "sarees",
                "unit_telugu": "చీరలు",
                "review_status": "CONFIRMED",
                "display_order": 4
            },
            {
                "source_ref": "REG_2026_DAY6_SPECIAL_PROG_1",
                "offering_type": "SPECIAL_PROGRAMME",
                "session": "MORNING",
                "sponsor_name": "Kala Lakshmayya Parimala dampathulu (Book donors: T. Subbarayudu Dhanalakshmi, Malladi Ravi Prashanth Kumar Lakshmi Pratibha, Chukka Ranga Malleswari children, T. Venkateswarlu Apparao)",
                "sponsor_name_telugu": "కాల లక్ష్మయ్య పరిమళ దంపతులు (పుస్తకాలు మరియు పెన్నుల పంపిణీ దాతలు: టి. సుబ్బరాయుడు ధనలక్ష్మి, మల్లాది రవి ప్రశాంత్ కుమార్ లక్ష్మీ ప్రతిభ, చుక్కా రంగ మల్లేశ్వరి పిల్లలు, టి. వెంకటేశ్వర్లు అప్పారావు)",
                "item_description": "Books & Pens Distribution to Students",
                "item_description_telugu": "విద్యార్థులకు పుస్తకాలు మరియు పెన్నుల పంపిణీ",
                "review_status": "CONFIRMED",
                "display_order": 1
            }
        ]
    },
    # ----------------------------------------------------
    # Day 7: 17 October 2026
    # ----------------------------------------------------
    {
        "date": "2026-10-17",
        "day_number": 7,
        "offerings": [
            {
                "source_ref": "REG_2026_DAY7_M_PRASADAM",
                "offering_type": "MORNING_PRASADAM",
                "session": "MORNING",
                "sponsor_name": MORNING_PRASADAM_EN,
                "sponsor_name_telugu": MORNING_PRASADAM_TE,
                "item_description": "Daily Morning Prasadam",
                "item_description_telugu": "ఉదయం నిత్య ప్రసాద వితరణ",
                "review_status": "NEEDS_REVIEW",
                "notes": "Daily morning prasadam assigned per latest committee instruction.",
                "notes_telugu": "తాజా కమిటీ సూచన మేరకు ఉదయం ప్రసాద దాతగా నిర్ణయించడమైనది.",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY7_E_PUJA_1",
                "offering_type": "EVENING_PUJA",
                "session": "EVENING",
                "sponsor_name": "Vaka Raghavendra Rao Tirupatamma dampathulu",
                "sponsor_name_telugu": "వాకా రాఘవేంద్రరావు తిరుపతమ్మ దంపతులు",
                "item_description": "Evening Puja",
                "item_description_telugu": "సాయంత్రం పూజ",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY7_E_PRASADAM_1",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Vaka Baburao Soubhagya dampathulu",
                "sponsor_name_telugu": "వాకా బాబూరావు సౌభాగ్య దంపతులు",
                "item_description": "Evening Prasadam",
                "item_description_telugu": "సాయంత్రం ప్రసాద వితరణ",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY7_LUCKY_DIP_1",
                "offering_type": "LUCKY_DIP",
                "session": "EVENING",
                "sponsor_name": "Vaka Baburao garu Soubhagya dampathulu",
                "sponsor_name_telugu": "వాకా బాబూరావు గారు సౌభాగ్య దంపతులు",
                "item_description": "Sarees",
                "item_description_telugu": "చీరలు",
                "quantity": "11",
                "unit": "sarees",
                "unit_telugu": "చీరలు",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY7_SPECIAL_PROG_1",
                "offering_type": "SPECIAL_PROGRAMME",
                "session": "EVENING",
                "sponsor_name": "Anantha Govindu garu",
                "sponsor_name_telugu": "అనంత గోవిందు గారు",
                "item_description": "Kolatam Programme",
                "item_description_telugu": "కోలాటం కార్యక్రమం",
                "review_status": "CONFIRMED",
                "display_order": 1
            }
        ]
    },
    # ----------------------------------------------------
    # Day 8: 18 October 2026
    # ----------------------------------------------------
    {
        "date": "2026-10-18",
        "day_number": 8,
        "offerings": [
            {
                "source_ref": "REG_2026_DAY8_M_PRASADAM",
                "offering_type": "MORNING_PRASADAM",
                "session": "MORNING",
                "sponsor_name": MORNING_PRASADAM_EN,
                "sponsor_name_telugu": MORNING_PRASADAM_TE,
                "item_description": "Daily Morning Prasadam",
                "item_description_telugu": "ఉదయం నిత్య ప్రసాద వితరణ",
                "review_status": "NEEDS_REVIEW",
                "notes": "Daily morning prasadam assigned per latest committee instruction.",
                "notes_telugu": "తాజా కమిటీ సూచన మేరకు ఉదయం ప్రసాద దాతగా నిర్ణయించడమైనది.",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY8_M_PUJA_1",
                "offering_type": "MORNING_PUJA",
                "session": "MORNING",
                "sponsor_name": "Vaka Phaneendra, Sai Harshith",
                "sponsor_name_telugu": "వాకా ఫణీంద్ర, సాయి హర్షిత్",
                "item_description": "Morning Puja (Garumalu Seva: Timmisetti Polayya, Srinu garu)",
                "item_description_telugu": "ఉదయం పూజ (గరుమాలు సేవ: తిమ్మిశెట్టి పోలయ్య, శ్రీను గారు)",
                "notes": "Special Service / Garumalu: Timmisetti Polayya, Srinu garu",
                "notes_telugu": "గరుమాలు సేవ: తిమ్మిశెట్టి పోలయ్య, శ్రీను గారు",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY8_E_PRASADAM_1",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Vaka Phaneendra, Sai Harshith",
                "sponsor_name_telugu": "వాకా ఫణీంద్ర, సాయి హర్షిత్",
                "item_description": "Pulihora",
                "item_description_telugu": "పులిహోర",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY8_SPECIAL_PROG_1",
                "offering_type": "SPECIAL_PROGRAMME",
                "session": "EVENING",
                "sponsor_name": "Anantha Govindu garu",
                "sponsor_name_telugu": "అనంత గోవిందు గారు",
                "item_description": "Kolatam Programme",
                "item_description_telugu": "కోలాటం కార్యక్రమం",
                "review_status": "CONFIRMED",
                "display_order": 1
            }
        ]
    },
    # ----------------------------------------------------
    # Day 9: 19 October 2026
    # ----------------------------------------------------
    {
        "date": "2026-10-19",
        "day_number": 9,
        "offerings": [
            {
                "source_ref": "REG_2026_DAY9_M_PRASADAM",
                "offering_type": "MORNING_PRASADAM",
                "session": "MORNING",
                "sponsor_name": MORNING_PRASADAM_EN,
                "sponsor_name_telugu": MORNING_PRASADAM_TE,
                "item_description": "Daily Morning Prasadam",
                "item_description_telugu": "ఉదయం నిత్య ప్రసాద వితరణ",
                "review_status": "NEEDS_REVIEW",
                "notes": "Daily morning prasadam assigned per latest committee instruction.",
                "notes_telugu": "తాజా కమిటీ సూచన మేరకు ఉదయం ప్రసాద దాతగా నిర్ణయించడమైనది.",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY9_E_PUJA_1",
                "offering_type": "EVENING_PUJA",
                "session": "EVENING",
                "sponsor_name": "Suragani Sambasiva Rao Bhavani dampathulu",
                "sponsor_name_telugu": "సూరగాని సాంబశివరావు భవాని దంపతులు",
                "item_description": "Evening Puja",
                "item_description_telugu": "సాయంత్రం పూజ",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY9_E_PRASADAM_1",
                "offering_type": "EVENING_PRASADAM",
                "session": "EVENING",
                "sponsor_name": "Suragani Sambasiva Rao Bhavani dampathulu",
                "sponsor_name_telugu": "సూరగాని సాంబశివరావు భవాని దంపతులు",
                "item_description": "Evening Prasadam",
                "item_description_telugu": "సాయంత్రం ప్రసాద వితరణ",
                "review_status": "CONFIRMED",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY9_SPECIAL_PROG_1",
                "offering_type": "SPECIAL_PROGRAMME",
                "session": "EVENING",
                "sponsor_name": "Suragani Venkatesh, Suragani Narendra, Koneni Pavan",
                "sponsor_name_telugu": "సూరగాని వెంకటేష్, సూరగాని నరేంద్ర, కోనేని పవన్",
                "item_description": "Kuchipudi Dance by Sri Lakshmi Narayana Kuchipudi Nritya Kalaniketan, Tenali (Guru: Semmozhi)",
                "item_description_telugu": "కూచిపూడి నృత్య ప్రదర్శన - శ్రీ లక్ష్మీ నారాయణ కూచిపూడి నృత్య కళానికేతన్, తెనాలి (గురువు: సెమ్మోళి)",
                "review_status": "CONFIRMED",
                "display_order": 1
            }
        ]
    },
    # ----------------------------------------------------
    # Day 10: 20 October 2026
    # ----------------------------------------------------
    {
        "date": "2026-10-20",
        "day_number": 10,
        "offerings": [
            {
                "source_ref": "REG_2026_DAY10_M_PRASADAM",
                "offering_type": "MORNING_PRASADAM",
                "session": "MORNING",
                "sponsor_name": MORNING_PRASADAM_EN,
                "sponsor_name_telugu": MORNING_PRASADAM_TE,
                "item_description": "Daily Morning Prasadam",
                "item_description_telugu": "ఉదయం నిత్య ప్రసాద వితరణ",
                "review_status": "NEEDS_REVIEW",
                "notes": "Daily morning prasadam assigned per latest committee instruction.",
                "notes_telugu": "తాజా కమిటీ సూచన మేరకు ఉదయం ప్రసాద దాతగా నిర్ణయించడమైనది.",
                "display_order": 1
            },
            {
                "source_ref": "REG_2026_DAY10_SPECIAL_PROG_1",
                "offering_type": "SPECIAL_PROGRAMME",
                "session": "EVENING",
                "sponsor_name": "Santi Nagaraju garu Sivakumari dampathulu",
                "sponsor_name_telugu": "శాంతి నాగరాజు గారు శివకుమారి దంపతులు",
                "item_description": "Gandhi Swamy Ayyappa Bhajan Brindam, Gokaraju Palem",
                "item_description_telugu": "గాంధీ స్వామి అయ్యప్ప భజన బృందం, గోకరాజు పాలెం",
                "cost_amount": 25000.00,
                "notes": "Informational programme cost noted as ₹25,000/- in register (Not a financial donation, informational only).",
                "notes_telugu": "కార్యక్రమ వ్యయ వివరాలు ₹25,000/- గా పేర్కొనబడినవి (నగదు జమ కాదు, కేవలం సమాచారం కొరకు).",
                "review_status": "CONFIRMED",
                "display_order": 1
            }
        ]
    }
]

def run_import():
    db = SessionLocal()
    try:
        # Fetch organization from FestivalDay
        first_day = db.query(FestivalDay).first()
        if not first_day:
            print("ERROR: No FestivalDay records found in database!")
            return
        
        org_id = first_day.organization_id
        print(f"Organization ID: {org_id}")

        created_count = 0
        updated_count = 0

        for day_entry in REGISTER_DATA:
            date_str = day_entry["date"]
            fest_day = db.query(FestivalDay).filter(FestivalDay.date == date_str).first()
            if not fest_day:
                print(f"WARNING: Festival day for date {date_str} not found in database! Skipping.")
                continue
            
            day_id = fest_day.id
            print(f"Processing Day {day_entry['day_number']} ({date_str}) - {fest_day.alankaram_name_telugu}...")

            for item in day_entry["offerings"]:
                source_ref = item["source_ref"]
                existing = db.query(DayOffering).filter(
                    DayOffering.source_reference == source_ref
                ).first()

                if existing:
                    # Update fields in-place
                    existing.festival_day_id = day_id
                    existing.offering_type = item["offering_type"]
                    existing.session = item.get("session")
                    existing.sponsor_name = item["sponsor_name"]
                    existing.sponsor_name_telugu = item.get("sponsor_name_telugu")
                    existing.item_description = item.get("item_description")
                    existing.item_description_telugu = item.get("item_description_telugu")
                    existing.quantity = item.get("quantity")
                    existing.unit = item.get("unit")
                    existing.unit_telugu = item.get("unit_telugu")
                    existing.cost_amount = item.get("cost_amount")
                    existing.notes = item.get("notes")
                    existing.notes_telugu = item.get("notes_telugu")
                    existing.review_status = item.get("review_status", "CONFIRMED")
                    existing.display_order = item.get("display_order", 1)
                    existing.is_published = True
                    updated_count += 1
                else:
                    new_offering = DayOffering(
                        id=str(uuid.uuid4()),
                        organization_id=org_id,
                        festival_day_id=day_id,
                        offering_type=item["offering_type"],
                        session=item.get("session"),
                        sponsor_name=item["sponsor_name"],
                        sponsor_name_telugu=item.get("sponsor_name_telugu"),
                        item_description=item.get("item_description"),
                        item_description_telugu=item.get("item_description_telugu"),
                        quantity=item.get("quantity"),
                        unit=item.get("unit"),
                        unit_telugu=item.get("unit_telugu"),
                        cost_amount=item.get("cost_amount"),
                        source_reference=source_ref,
                        notes=item.get("notes"),
                        notes_telugu=item.get("notes_telugu"),
                        review_status=item.get("review_status", "CONFIRMED"),
                        display_order=item.get("display_order", 1),
                        is_published=True
                    )
                    db.add(new_offering)
                    created_count += 1

                # Log Morning Prasadam Audit Log if applicable
                if item["offering_type"] == "MORNING_PRASADAM":
                    audit = AuditLog(
                        id=str(uuid.uuid4()),
                        organization_id=org_id,
                        user_id="SYSTEM_IMPORT",
                        action="MORNING_PRASADAM_ASSIGNMENT",
                        entity_type="DayOffering",
                        entity_id=existing.id if existing else new_offering.id,
                        new_value={
                            "date": date_str,
                            "day_number": day_entry["day_number"],
                            "sponsor_name": item["sponsor_name"],
                            "sponsor_name_telugu": item["sponsor_name_telugu"],
                            "review_status": item["review_status"],
                            "instruction": "Assigned per latest confirmed committee instruction with spelling flagged for review."
                        }
                    )
                    db.add(audit)

        db.commit()
        print(f"\nImport Completed Successfully!")
        print(f"Created offerings: {created_count}")
        print(f"Updated offerings: {updated_count}")
        print(f"Total processed: {created_count + updated_count}")

    except Exception as e:
        db.rollback()
        print(f"Error during import: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_import()
