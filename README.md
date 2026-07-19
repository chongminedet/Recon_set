<img width="640" height="315" alt="image" src="https://github.com/user-attachments/assets/527ba247-4c24-4b6b-9623-57f87ce17796" />

 
Recon_set: A tool for performing multiple passive and active reconnaissance scans on the web, you'd normally need a Linux machine or separately installed tools to perform scans. It holds all the most basic scans we use for everyday reconnaissance. 

 ## Local Setup: 
 Prerequisites: 
1. [Docker](https://www.docker.com/products/docker-desktop/) installed and running

2.Clone the repository:
git clone https://github.com/chongminedet/Recon_set.git

3. Build and start the containers:
cd Recon_set. 
docker compose up -d --build

4. Open in frontend browser: http://localhost:3000
## Services running: 

| Service  | Port | Description              |
|----------|------|--------------------------|
| nginx    | 80   | Reverse proxy            |
| api      | 5000 | Flask backend            |
| frontend | 3000 | React app (internal)     |

## Stop: 
docker compose down. 

Happy scanning  （￣︶￣）↗

