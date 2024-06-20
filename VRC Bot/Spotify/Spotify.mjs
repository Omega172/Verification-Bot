import https from 'https';

export async function GetToken(APIKey, ResponseCallback) {
    const Request = https.get(`https://spotify-visualiser.vercel.app/api/refresh?refresh_token=${APIKey}`, (Response) => {
        Response.setEncoding('utf8');

        let Data = '';
        Response.on('data', (Chunk) => {
            Data += Chunk;
        });

        Response.on('end', () => {
            if (Response.statusCode == 200)
                ResponseCallback(JSON.parse(Data)['access_token']);
        });
    });

    Request.on('error', (Error) => {
        console.log(`Error: ${Error}`);
    });

    Request.end();
}

export async function GetSongData(SpotifyToken, ResponseCallback) {
    const Options = {
        host: 'api.spotify.com',
        path: '/v1/me/player/currently-playing',
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SpotifyToken}`
        }
    };

    const Request = https.request(Options, (Response) => {
        Response.setEncoding('utf8');

        let Data = '';
        Response.on('data', (Chunk) => {
            Data += Chunk;
        });

        Response.on('end', () => {
            if (Response.statusCode == 200) {
                if (Data == '') {
                    return ResponseCallback('Error');
                }

                return ResponseCallback(JSON.parse(Data)['item']['external_urls']['spotify']);
            }

            return ResponseCallback('Error');
        });
    });

    Request.on('error', (Error) => {
        console.log(`Error: ${Error}`);
    });

    Request.end();
}