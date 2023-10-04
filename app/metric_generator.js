import { StatsD } from 'hot-shots';

const STATSD_HOST = "graphite";
const STATSD_PORT = 8125;
const STATSD_PREFIX = "external-api.";

class MetricGenerator {

    constructor() {
        this.client = new StatsD({
            host: STATSD_HOST,
            port: STATSD_PORT,
            prefix: STATSD_PREFIX,
            errorHandler: function (error) {
                console.log("Error on StatsD - Socket errors caught here: ", error);
            }
        });
    }

    responseTimeMetric(startTime, endTime) {
        const responseTime = endTime - startTime;
        this.client.timing("response_time", responseTime);
    }
}

export default MetricGenerator;