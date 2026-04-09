const fetch = require('node-fetch');

async function debugUpdate() {
    // 1. Get a token
    const token = require('jsonwebtoken').sign(
      { tenant_id: 'b107828b-98a9-498d-a1f7-b077510eda1c', role: 'owner' },
      process.env.JWT_SECRET || 'linkhub_secret_jwt_key_2026_dev'
    );
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // 2. Fetch the links to get an ID
    let res = await fetch('http://localhost:4000/api/links', { headers });
    let links = await res.json();
    if (links.error) {
        console.log("Error fetching links:", links.error);
        return;
    }
    if (links.length === 0) {
        console.log("No links found for tenant.");
        return;
    }
    const link = links[0];
    console.log("Found link:", link.id, link.title);

    // 3. Try updating
    res = await fetch(`http://localhost:4000/api/links/${link.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
            title: link.title + " updated",
            url: link.url,
            icon: link.icon,
            description: link.description || ""
        })
    });
    
    console.log("Update status:", res.status);
    const updated = await res.json();
    console.log("Update response:", updated);
}
debugUpdate().catch(console.error);
