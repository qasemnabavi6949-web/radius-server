FROM ubuntu:22.04

USER root
ENV DEBIAN_FRONTEND=noninteractive

# Install FreeRADIUS and MySQL module
RUN apt-get update && \
    apt-get install -y freeradius freeradius-mysql && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY sql.conf /tmp/sql.conf
COPY default.conf /tmp/default.conf

# Apply our configurations manually to the Ubuntu-installed freeradius paths
# Ubuntu places FreeRADIUS config in /etc/freeradius/3.0
RUN RADDB="/etc/freeradius/3.0" && \
    echo "Using RADDB=$RADDB" && \
    # Overwrite the sql module configuration
    cp /tmp/sql.conf $RADDB/mods-available/sql && \
    ln -sf $RADDB/mods-available/sql $RADDB/mods-enabled/sql && \
    # Overwrite the default site configuration
    cp /tmp/default.conf $RADDB/sites-available/default && \
    ln -sf $RADDB/sites-available/default $RADDB/sites-enabled/default && \
    # Disable inner-tunnel for simplicity, we don't need PEAP/EAP for basic Hotspot
    rm -f $RADDB/sites-enabled/inner-tunnel || true && \
    rm -f $RADDB/mods-enabled/eap || true && \
    # Add a catch-all client for Docker NAT compatibility
    echo 'client 0.0.0.0/0 {' >> $RADDB/clients.conf && \
    echo '    secret = testing123' >> $RADDB/clients.conf && \
    echo '    shortname = catchall' >> $RADDB/clients.conf && \
    echo '}' >> $RADDB/clients.conf

# Run the FreeRADIUS server in foreground with debug output
CMD ["freeradius", "-f"]
