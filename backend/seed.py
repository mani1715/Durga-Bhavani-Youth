import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.db_models import (
    Organization, Event, User, Donor, DonationCategory, ExpenseCategory, ReceiptTemplate,
    FestivalDay, ProgrammeActivity, PoojaCouple, Announcement, Sponsor
)

def seed_db():
    db = SessionLocal()
    # Create all tables safely
    Base.metadata.create_all(bind=engine)

    try:
        # 1. Create / Retrieve Garuvupalem Durga Bhavani Youth Organization
        org = db.query(Organization).filter(
            (Organization.slug == "garuvupalem-durga-bhavani-youth") |
            (Organization.name.ilike("%Garuvupalem%"))
        ).first()

        if not org:
            org = Organization(
                name="గరువుపాలెం దుర్గాభవాని యూత్",
                slug="garuvupalem-durga-bhavani-youth",
                festival_name="31వ దేవీ శరన్నవరాత్రి మహోత్సవములు",
                year="2026",
                address="గరువుపాలెం, చేబ్రోలు మండలం, గుంటూరు జిల్లా",
                contact_number="8897557545, 9912844424, 9963397056",
                bank_details={
                    "bank_name": "State Bank of India",
                    "acc_number": "310022334455",
                    "ifsc": "SBIN0001234"
                }
            )
            db.add(org)
            db.flush()
        else:
            org.name = "గరువుపాలెం దుర్గాభవాని యూత్"
            org.festival_name = "31వ దేవీ శరన్నవరాత్రి మహోత్సవములు"
            org.year = "2026"
            org.address = "గరువుపాలెం, చేబ్రోలు మండలం, గుంటూరు జిల్లా"
            org.contact_number = "8897557545, 9912844424, 9963397056"
            db.flush()

        # 2. Create Active Event
        event = db.query(Event).filter(
            Event.organization_id == org.id,
            Event.financial_year == "2026"
        ).first()

        if not event:
            event = Event(
                organization_id=org.id,
                name="31వ దేవీ శరన్నవరాత్రి మహోత్సవములు 2026",
                description="గరువుపాలెం గ్రామంలో దుర్గాభవాని యూత్ ఆధ్వర్యంలో జరుగు 31వ దేవీ శరన్నవరాత్రి మహోత్సవములు",
                financial_year="2026",
                status="ACTIVE"
            )
            db.add(event)
            db.flush()
        else:
            event.status = "ACTIVE"
            db.flush()

        # 3. Create or update Admin User to belong to Garuvupalem Org
        admin = db.query(User).filter(User.email == "admin@festival.com").first()
        if not admin:
            admin = User(
                organization_id=org.id,
                name="దుర్గాభవాని యూత్ నిర్వాహకులు",
                email="admin@festival.com",
                phone="8897557545",
                password_hash=hash_password("admin123"),
                role="ORG_ADMIN",
                is_active=True
            )
            db.add(admin)
        else:
            admin.organization_id = org.id
            admin.name = "దుర్గాభవాని యూత్ నిర్వాహకులు"
            admin.phone = "8897557545"
            db.flush()

        # 4. Seed Festival Days & Schedule (Idempotent)
        days_schedule = [
            {
                "day_number": 0,
                "date": "2026-10-10",
                "alankaram_name_telugu": "శ్రీ అమ్మవారి ఆగమనం & శోభాయాత్ర",
                "alankaram_name_english": "Ammavari Arrival & Procession",
                "description_telugu": "సంగం జాగర్లమూడి నుండి అమ్మవారి బయలుదేరుట మరియు గరువుపాలెం గ్రామ రాక శోభాయాత్ర",
                "activities": [
                    {"title_telugu": "సంగం జాగర్లమూడి నుండి అమ్మవారి బయలుదేరుట", "time_str": "సా|| 4-00 గంటలకు", "activity_type": "PROCESSION"},
                    {"title_telugu": "గరువుపాలెం రాక మరియు గ్రామోత్సవ శోభాయాత్ర", "time_str": "రాత్రి 9-30 గంటలకు", "activity_type": "PROCESSION"}
                ]
            },
            {
                "day_number": 1,
                "date": "2026-10-11",
                "alankaram_name_telugu": "శ్రీ బాలా త్రిపుర సుందరి దేవి",
                "alankaram_name_english": "Sri Bala Tripura Sundari Devi",
                "description_telugu": "మహోత్సవ ప్రారంభము మరియు ప్రతిష్ఠా కార్యక్రమము",
                "activities": [
                    {"title_telugu": "శ్రీ దేవీ శరన్నవరాత్రి మహోత్సవ ప్రారంభము & ప్రతిష్ఠా పూజ", "time_str": "ఉదయం 10-00 గంటలకు", "activity_type": "RITUAL"},
                    {"title_telugu": "సాయంత్రం దివ్య మంగళ హారతి & ప్రసాద వితరణ", "time_str": "సా|| 6-30 గంటలకు", "activity_type": "RITUAL"}
                ]
            },
            {
                "day_number": 2,
                "date": "2026-10-12",
                "alankaram_name_telugu": "శ్రీ గాయత్రి దేవి",
                "alankaram_name_english": "Sri Gayatri Devi",
                "description_telugu": "వేదమాత గాయత్రి దేవి రూపంలో అమ్మవారి దివ్య దర్శనం",
                "activities": [
                    {"title_telugu": "ఉదయం అభిషేకము మరియు గాయత్రీ సహస్రనామ పారాయణ", "time_str": "సమయం త్వరలో తెలియజేస్తాము", "activity_type": "RITUAL"}
                ]
            },
            {
                "day_number": 3,
                "date": "2026-10-13",
                "alankaram_name_telugu": "శ్రీ అన్నపూర్ణా దేవి",
                "alankaram_name_english": "Sri Annapurna Devi",
                "description_telugu": "సకల జీవరాశులకు అన్నప్రదాత శ్రీ అన్నపూర్ణా దేవి అలంకారం",
                "activities": [
                    {"title_telugu": "అన్నపూర్ణాష్టక పారాయణ మరియు ప్రత్యేక నివేదన", "time_str": "సమయం త్వరలో తెలియజేస్తాము", "activity_type": "RITUAL"}
                ]
            },
            {
                "day_number": 4,
                "date": "2026-10-14",
                "alankaram_name_telugu": "శ్రీ మహాచండీ దేవి",
                "alankaram_name_english": "Sri Maha Chandi Devi",
                "description_telugu": "శ్రీ మహాచండీ హోమము మరియు క్రీడా పోటీల ప్రారంభం",
                "activities": [
                    {"title_telugu": "శ్రీ మహాచండీ హోమము", "time_str": "ఉదయం 7-00 గంటలకు", "activity_type": "SPECIAL"},
                    {"title_telugu": "యువకులు మరియు పిల్లల క్రీడా పోటీల ప్రారంభం", "time_str": "సమయం త్వరలో తెలియజేస్తాము", "activity_type": "COMPETITION"}
                ]
            },
            {
                "day_number": 5,
                "date": "2026-10-15",
                "alankaram_name_telugu": "శ్రీ లలితా త్రిపుర సుందరి దేవి",
                "alankaram_name_english": "Sri Lalita Tripura Sundari Devi",
                "description_telugu": "లలితా సహస్రనామ పూజ మరియు కుంకుమార్చన",
                "activities": [
                    {"title_telugu": "శ్రీ లలితా సహస్రనామ పారాయణ మరియు విశేష కుంకుమార్చన", "time_str": "సమయం త్వరలో తెలియజేస్తాము", "activity_type": "RITUAL"}
                ]
            },
            {
                "day_number": 6,
                "date": "2026-10-16",
                "alankaram_name_telugu": "శ్రీ సరస్వతి దేవి — మూలా నక్షత్రం",
                "alankaram_name_english": "Sri Saraswati Devi - Moola Nakshatram",
                "description_telugu": "చదువుల తల్లి సరస్వతి దేవి అలంకారం & విద్యార్థులచే పూజలు",
                "activities": [
                    {"title_telugu": "విద్యార్థులచే ప్రత్యేక అక్షరాభ్యాసం & సరస్వతి పూజ", "time_str": "సమయం త్వరలో తెలియజేస్తాము", "activity_type": "SPECIAL"},
                    {"title_telugu": "పోటీలలో గెలుపొందిన విజేతలకు బహుమతుల ప్రదానం", "time_str": "సమయం త్వరలో తెలియజేస్తాము", "activity_type": "CULTURAL"}
                ]
            },
            {
                "day_number": 7,
                "date": "2026-10-17",
                "alankaram_name_telugu": "శ్రీ మహాలక్ష్మీ దేవి",
                "alankaram_name_english": "Sri Maha Lakshmi Devi",
                "description_telugu": "అష్టలక్ష్మీ స్వరూపిణి శ్రీ మహాలక్ష్మీ దేవి అలంకారం",
                "activities": [
                    {"title_telugu": "శ్రీ మహాలక్ష్మీ అష్టోత్తర పూజ మరియు ధనలక్ష్మి కుంకుమార్చన", "time_str": "సమయం త్వరలో తెలియజేస్తాము", "activity_type": "RITUAL"}
                ]
            },
            {
                "day_number": 8,
                "date": "2026-10-18",
                "alankaram_name_telugu": "శ్రీ దుర్గాదేవి",
                "alankaram_name_english": "Sri Durga Devi",
                "description_telugu": "దుర్గాష్టమి పర్వదినం - శ్రీ దుర్గాదేవి దివ్య అలంకారం",
                "activities": [
                    {"title_telugu": "దుర్గా సూక్త పారాయణ మరియు విశేష దీపారాధన", "time_str": "సమయం త్వరలో తెలియజేస్తాము", "activity_type": "RITUAL"}
                ]
            },
            {
                "day_number": 9,
                "date": "2026-10-19",
                "alankaram_name_telugu": "శ్రీ మహిషాసురమర్దినీ దేవి",
                "alankaram_name_english": "Sri Mahishasura Mardhini Devi",
                "description_telugu": "మహర్నవమి పర్వదినం - శ్రీ మహిషాసురమర్దినీ అలంకారం",
                "activities": [
                    {"title_telugu": "మహిషాసురమర్దిని స్తోత్ర పారాయణ మరియు చండీ పారాయణ", "time_str": "సమయం త్వరలో తెలియజేస్తాము", "activity_type": "RITUAL"}
                ]
            },
            {
                "day_number": 10,
                "date": "2026-10-20",
                "alankaram_name_telugu": "శ్రీ రాజరాజేశ్వరి దేవి",
                "alankaram_name_english": "Sri Raja Rajeshwari Devi",
                "description_telugu": "విజయదశమి పర్వదినం - రాజరాజేశ్వరి అలంకారం, ఆయుధ పూజ, అన్నదానం & సాంస్కృతిక కార్యక్రమాలు",
                "activities": [
                    {"title_telugu": "ఆయుధ పూజ మరియు అక్షరాభ్యాసం", "time_str": "ఉదయం నుండి", "activity_type": "SPECIAL"},
                    {"title_telugu": "భక్తులందరికీ విశేష మహానివేదన & అన్నదానం", "time_str": "మధ్యాహ్నం 12-00 గంటల నుండి", "activity_type": "SPECIAL"},
                    {"title_telugu": "సాయంత్రం సాంస్కృతిక కార్యక్రమాలు & నాటక ప్రదర్శన", "time_str": "రాత్రి 7-00 గంటలకు", "activity_type": "CULTURAL"}
                ]
            },
            {
                "day_number": 11,
                "date": "2026-10-21",
                "alankaram_name_telugu": "శ్రీ అమ్మవారి గ్రామోత్సవం & పూర్ణాహుతి",
                "alankaram_name_english": "Ammavari Gramotsavam & Purnahuti",
                "description_telugu": "దేవీ శరన్నవరాత్రి పూర్ణాహుతి మరియు శ్రీ అమ్మవారి వైభవ గ్రామోత్సవము",
                "activities": [
                    {"title_telugu": "శ్రీ దేవీ పూర్ణాహుతి మరియు వసంతోత్సవం", "time_str": "సా|| 5-00 గంటలకు", "activity_type": "RITUAL"},
                    {"title_telugu": "శ్రీ అమ్మవారి దివ్య గ్రామోత్సవం (గరువుపాలెం வீధుల గుండా)", "time_str": "సాయంత్రం 7-00 గంటల నుండి", "activity_type": "PROCESSION"}
                ]
            }
        ]

        for ddata in days_schedule:
            existing_day = db.query(FestivalDay).filter(
                FestivalDay.organization_id == org.id,
                FestivalDay.event_id == event.id,
                FestivalDay.date == ddata["date"]
            ).first()

            if not existing_day:
                fday = FestivalDay(
                    organization_id=org.id,
                    event_id=event.id,
                    date=ddata["date"],
                    day_number=ddata["day_number"],
                    alankaram_name_telugu=ddata["alankaram_name_telugu"],
                    alankaram_name_english=ddata["alankaram_name_english"],
                    description_telugu=ddata["description_telugu"],
                    is_completed=False,
                    is_published=True
                )
                db.add(fday)
                db.flush()

                for order, act in enumerate(ddata["activities"]):
                    pact = ProgrammeActivity(
                        festival_day_id=fday.id,
                        title_telugu=act["title_telugu"],
                        time_str=act["time_str"],
                        activity_type=act["activity_type"],
                        display_order=order,
                        is_published=True
                    )
                    db.add(pact)

        # 5. Create Default Announcement & Sample Confirmed Donors
        ann = db.query(Announcement).filter(Announcement.organization_id == org.id).first()
        if not ann:
            ann = Announcement(
                organization_id=org.id,
                title_telugu="31వ దేవీ శరన్నవరాత్రి మహోత్సవ ఆహ్వానము",
                content_telugu="శ్రీ దుర్గాభవాని యూత్ ఆధ్వర్యంలో గరువుపాలెం గ్రామంలో అక్టోబర్ 10 నుండి 21 వరకు జరుగు 31వ దేవీ శరన్నవరాత్రి మహోత్సవములకు భక్తులందరూ విచ్చేసి అమ్మవారి కృపాకటాక్షములు పొందగలరని ప్రార్థన.",
                is_published=True
            )
            db.add(ann)

        db.commit()
        print("Garuvupalem Dasara Festival database initialized cleanly!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
