package repositories
 
import(
	"context"
	"database/sql"
	"social-network/internal/models"
)



type UserRepo struct{
		db *sql.DB
}

func NewUserRepo(db *sql.DB) *UserRepo{
	return &UserRepo{db:db}
}


func (r *UserRepo) GetProfile(ctx context.Context, userID int64) (*models.UserProfile, error) {
	query := `
		SELECT
			u.id,
			u.first_name,
			u.last_name,
			COALESCE(u.nickname, ''),
			COALESCE(u.about_me, ''),
			COALESCE(u.avatar_path, ''),
			u.profile_visibility,
			u.created_at,
			COUNT(DISTINCT f_in.follower_id)   AS follower_count,
			COUNT(DISTINCT f_out.following_id) AS following_count,
			COUNT(DISTINCT p.id)               AS post_count
		FROM users u
		LEFT JOIN followers f_in  ON f_in.following_id  = u.id
		LEFT JOIN followers f_out ON f_out.follower_id   = u.id
		LEFT JOIN posts p         ON p.user_id           = u.id
		WHERE u.id = ?
		GROUP BY u.id
	`

	profile := &models.UserProfile{}
	var visibility string

	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&profile.ID,
		&profile.FirstName,
		&profile.LastName,
		&profile.Nickname,
		&profile.AboutMe,
		&profile.Avatar,
		&visibility,
		&profile.CreatedAt,
		&profile.FollowerCount,
		&profile.FollowingCount,
		&profile.PostCount,
	)
	if err != nil {
		return nil, err
	}

	profile.IsPrivate = visibility == "private"
	return profile, nil
}