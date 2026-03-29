package utils

import (
	"log"
	"social-network/internal/repositories"
	"time"
)

func StartEventCleanup(repo *repositories.GroupRepo, interval time.Duration) {
	//one time for startup

	ticker := time.NewTicker(interval)

	go func() {
		defer ticker.Stop()

		for {
			err := repo.DeletePastEvents()
			if err != nil {
				log.Println("failed to delete past events:", err)
			} else {
				log.Println("past events cleanup ran successfully")
			}

			<-ticker.C
		}
	}()
}
