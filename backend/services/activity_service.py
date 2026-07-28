from models.activity import ActivityLog
from extensions import db

class ActivityService:
    @staticmethod
    def log_activity(customer_id, activity_type, description, commit=True):
        """
        Logs a new activity for a customer.
        """
        activity = ActivityLog(
            customer_id=customer_id,
            activity_type=activity_type,
            description=description
        )
        db.session.add(activity)
        if commit:
            db.session.commit()
        return activity

    @staticmethod
    def get_customer_timeline(customer_id):
        """
        Retrieves the timeline of activities for a specific customer, ordered by newest first.
        """
        activities = ActivityLog.query.filter_by(customer_id=customer_id).order_by(ActivityLog.created_at.desc()).all()
        return [
            {
                'id': a.id,
                'activity_type': a.activity_type,
                'description': a.description,
                'created_at': a.created_at.isoformat()
            } for a in activities
        ]
