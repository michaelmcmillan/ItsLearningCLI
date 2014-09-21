# ItsLearningCLI
This is a command line tool that aims to replace the most noodle-nending counter-intuitive
application ever made: ItsLearning.com.

## Screenshots
##### Messages in the inbox
![Screenshot of inbox](screens/inbox.png)

##### Notifications
![Screenshot of inbox](screens/notifications.png)

## Installation
```bash
npm install itslearningcli
```
## Usage
```
Usage:
  its [OPTIONS] [ARGS]

Options:
  -s, --setup            Setup credentials and driver.
  -n, --notifications    List notifications.
  -i, --inbox            List messages in your inbox.
  -d, --dashboard        Spit out a summary of everything
  -h, --help             Display help and usage details
```
## Contributing
It'sLearning supports several ways of authentication. For instance, the
NTNU (Norwegian University of Science and Technology) uses SAML (Security
Assertion Markup Language) while others only use the "native" It'sLearning
login.

This is why itslearningcli ships with a directory called <code>drivers</code>.
If you want to login to It'sLearning with itslearningcli there has to be a compatible
driver for your school. Unfortunately I don't have the rights to log into schools
I'm not studying at, therefore I need help writing drivers.

A pull-request is greatly appreciated and I'll make sure to credit everyone who
helps out.
