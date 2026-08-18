use r_server::{
    client::Client,
    debug,
    request::Request,
    response::{ContentType, Response, Status::BadRequest},
    router::Method,
    server::http::Server,
};

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
    Server::new()?
        .route(Method::GET, "/api/v1/cities", get_cities)
        .route(Method::GET, "/api/v1/reverse", get_reverse)
        .route(Method::GET, "/api/v1/temperature", get_temperature)
        .run()?;

    Ok(())
}
