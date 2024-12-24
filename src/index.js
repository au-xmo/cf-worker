
import { parse } from "cookie";
import { jwtDecode } from "jwt-decode";


export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
    	const regexp = /\/secure(\/(\w+))?/;
		const filename = url.pathname;
		const matches = filename.match(regexp);
		try {
			if (matches) {
				if(matches[2] === undefined) {
					//Access to /secure
					const template = `
					<!DOCTYPE html>
					<html lang="en">
					<head>
						<meta charset="UTF-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Identity Information</title>
						<style>
							table {
								width: 50%;
								margin: 20px auto;
								border-collapse: collapse;
							}
							th, td {
								border: 1px solid #ddd;
								padding: 8px;
								text-align: left;
							}
							th {
								background-color: #f2f2f2;
							}
						</style>
					</head>
					<body>
					<h1 style="text-align: center;">Identity Information</h1>
						<table>
							<tbody>
								<tr>
									<td>Email:</td><td>{email}</td>
								</tr>
								<tr>
									<td>Timestamp:</td><td>{timestamp}</td>
								</tr>
								<tr>
									<td>Country:</td><td><a href="/secure/{country}"><img width="50" height="50" src="/secure/{country}" alt="flag of {country}"></img></a></td>
								</tr>
							</tbody>
						</table>
					</body>
					</html>
					`;

					const COOKIE_NAME = "CF_Authorization";
					const cookie = parse(request.headers.get("Cookie") || "");
					if (cookie[COOKIE_NAME] != null) {
						const jwt_str = cookie[COOKIE_NAME];
						const decoded = jwtDecode(jwt_str);
						const email = decoded.email;
						const timestamp = new Date(decoded.iat * 1000);
						const country = decoded.country.toLowerCase();;
						const html = template.replaceAll("{email}",email).replaceAll("{timestamp}",timestamp.toLocaleString()).replaceAll("{country}",country);
						return new Response(html, { 
							headers: {
							  "Content-Type": "text/html;charset=UTF-8",
							},
							status: 200
						});
					} else {
						return new Response('No Authorization info found!', { status: 401 });
					}
				} else {
					//Access to /secure/${country}
					const country = matches[2];
					const object = await env.flags.get(country + ".svg");
					if (!object) {
        				return new Response(`Image not found for ${country}`, { status: 404 });
      				}
					return new Response(object.body, {
						headers: {
							'Content-Type': object.httpMetadata.contentType || 'application/octet-stream',
							status: 200
						},
					});
				}
			} else {
				return new Response("Resource can't be found", { status: 404 });
			}
		} catch (err) {			
			return new Response(err, { status: 500 });
	  	}
	}
};
