echo "=== Step 1: Installing UFW (if not already present) ==="
sudo apt update
sudo apt install ufw -y

echo ""
echo "=== Step 2: Setting default policies ==="
sudo ufw default deny incoming
sudo ufw default allow outgoing

echo ""
echo "=== Step 3: Allow SSH (port 22) ==="
sudo ufw allow ssh

echo ""
echo "=== Step 4: Deny HTTP (port 80) ==="
sudo ufw deny http

echo ""
echo "=== Step 5: Allow HTTPS (port 443) ==="
sudo ufw allow https

echo ""
echo "=== Step 6: Deny a specific IP range ==="
sudo ufw deny from 203.0.113.0/24

echo ""
echo "=== Step 7: Enable UFW ==="
sudo ufw --force enable

echo ""
echo "=== Step 8: Verify active rules ==="
sudo ufw status verbose
