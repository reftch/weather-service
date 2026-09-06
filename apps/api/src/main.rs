use std::path::Path;

use r_server::{
    client::Client,
    core::http::Server,
    debug,
    request::Request,
    response::{ContentType, Response, Status::BadRequest},
    router::Method,
};

fn resolve_assets_path() -> String {
    if let Ok(p) = std::env::var("ASSETS_PATH") {
        return p;
    }
    // Try common locations relative to different working directories and Docker.
    for candidate in [
        "../web/dist",
        "apps/web/dist",
        "./assets",
        "/assets",
        "web/dist",
    ] {
        if Path::new(candidate).is_dir() {
            return candidate.to_string();
        }
    }
    // Default for local dev (cargo run from apps/api)
    "../web/dist".to_string()
}

fn get_temperature(req: &Request, res: &mut Response) {
    let latitude = match req.query("latidude") {
        Some(v) => v,
        None => {
            res.status(BadRequest).body("Missing latidude");
            return;
        }
    };

    let longtitude = match req.query("longtitude") {
        Some(v) => v,
        None => {
            res.status(BadRequest).body("Missing longtitude");
            return;
        }
    };

    debug!("Latitude: {}, Longtitude: {}", latitude, longtitude);

    let client = Client::new("https://api.open-meteo.com");
    let path = format!(
        "/v1/forecast?latitude={}&longitude={}\
            &current=temperature_2m&current=weather_code&current=wind_speed_10m&current=cloud_cover\
            &hourly=temperature_2m,precipitation_probability,wind_speed_10m,cloud_cover\
            &daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,weather_code,precipitation_sum,wind_speed_10m_max\
            &forecast_days=10&timezone=auto",
        latitude, longtitude
    );

    let body = client.get(&path).unwrap();
    res.content_type(ContentType::JSON).body(body);
}

fn get_cities(req: &Request, res: &mut Response) {
    let keyword = match req.query("keyword") {
        Some(v) => v,
        None => {
            res.status(BadRequest).body("Missing keyword");
            return;
        }
    };

    debug!("Keyword: {}", keyword);

    let client = Client::new("https://photon.komoot.io");
    let path = format!("/api/?q={}", keyword);

    let body = client.get(&path).unwrap();
    res.content_type(ContentType::JSON).body(body);
}

fn get_reverse(req: &Request, res: &mut Response) {
    let latitude = match req.query("lat") {
        Some(v) => v,
        None => {
            res.status(BadRequest).body("Missing latitude");
            return;
        }
    };

    let longtitude = match req.query("lon") {
        Some(v) => v,
        None => {
            res.status(BadRequest).body("Missing longtitude");
            return;
        }
    };

    debug!("Latitude: {}, Longtitude: {}", latitude, longtitude);

    let client = Client::new("https://photon.komoot.io");
    let path = format!("/reverse?lat={}&lon={}", latitude, longtitude);

    let body = client.get(&path).unwrap();
    res.content_type(ContentType::JSON).body(body);
}

fn main() -> std::io::Result<()> {
    let assets_path = resolve_assets_path();
    Server::new()?
        .route(Method::GET, "/api/v1/cities", get_cities)
        .route(Method::GET, "/api/v1/reverse", get_reverse)
        .route(Method::GET, "/api/v1/temperature", get_temperature)
        .assets_path(&assets_path)
        .run()?;

    Ok(())
}
