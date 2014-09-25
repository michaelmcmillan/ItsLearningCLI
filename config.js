var fs = require('fs');

module.exports = function () {

    this.configFilename = '.itsconf';

    this.config = {};

    this.getHomeDir = function () {
        return process.env.HOME
            || process.env.HOMEPATH
            || process.env.USERPROFILE;
    }

    this.exists = function () {
        return fs.existsSync(
            this.getHomeDir() + '/' + this.configFilename
        );
    }

    this.getWriteableConfig = function () {
        return JSON.stringify(this.config, null, 4);
    }

    this.getField = function (field) {
        return this.config[field];
    }

    this.set = function (config) {
        this.config = config;
    }

    this.load = function () {
        try {
            var loadedConfig = JSON.parse(fs.readFileSync(
                this.getHomeDir() + '/' + this.configFilename
            ));
            this.set(loadedConfig);

        } catch (err) {
            throw err;
        }
    }

    this.save = function () {
        fs.writeFile(
            this.getHomeDir() + '/' + this.configFilename,
            this.getWriteableConfig(),
            function (err) {
                if (err)
                  throw err;
        });
    }
}
