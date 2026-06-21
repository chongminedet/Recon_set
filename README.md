<img width="317" height="80" alt="image" src="https://github.com/user-attachments/assets/bfcc087b-3369-4a84-9eab-692b2d2e9c56" />Recon_set: briging  all essential reconnaissance tools across different environments to the web.
perfom scan with out using Virtual machine or installing additional tools on your windows.

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

Happy scanning （￣︶￣）↗　


