#!/bin/bash
# پیدا کردن یوزرهای مسدود شده
BLOCKED_USERS=$(docker exec -i sas-radius-db mysql -u radius -pradpass radius -N -e "SELECT username FROM radcheck WHERE attribute='Auth-Type' AND value='Reject';")

for USER in $BLOCKED_USERS; do
    echo "Force kicking blocked user from Docker: $USER"
    
    # پیدا کردن آی پی فرمد کاربر
    USER_IP=$(docker exec -i sas-radius-db mysql -u radius -pradpass radius -N -e "SELECT framedipaddress FROM radacct WHERE username='$USER' AND acctstoptime IS NULL ORDER BY radacctid DESC LIMIT 1;")
    
    if [ ! -z "$USER_IP" ] && [ "$USER_IP" != "NULL" ]; then
        # ارسال پکت قطع ارتباط همراه با آی پی به سمت میکروتیک اصلی
        docker exec -i sas-radius-core sh -c "printf 'User-Name=%s\nFramed-IP-Address=%s' '$USER' '$USER_IP' | radclient -x 100.100.100.1:3799 disconnect testing1234"
    else
        # ارسال فقط با یوزرنام در صورت نبود آی پی
        docker exec -i sas-radius-core sh -c "echo 'User-Name=$USER' | radclient -x 100.100.100.1:3799 disconnect testing1234"
    fi
done
