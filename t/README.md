# Hey

To test specific test in a specific order (login will be first anyway)
or a single one, run `perl t/policyweb.t` with possible arguments:
* remotely ( testing with BrowserStack )
* ie ( Internet Explorer 11.0 )
* login
* services
* networks
* entitlement
* diff

example: 
`perl t/policyweb.t` - all
`perl t/policyweb.t networks` - only networks
`perl t/policyweb.t remotely ie login services` 

# BrowserStack

To run on tests remotely with BrowserStack open a data tunnel befor.
run `Netspoc-Web/t/BrowserStackLocal --key <key from BrowserStack, same as in Frontends new>`

**Right now only testing on Internet Explore is functional with BrowserStack**

Selenium Standalone Server is used on BrowserStack. 
Some tests are broken while using the standalone server (print previews are not testable)
```
send_keys_to_active_element
get_window_handles
switch_to_window
```

# local again without a standalone server

To run local tests that are able to test the print previews, use Selenium::Chrome instead.
Uncomment those test in *Service.pm* and *OwnNetworks.pm* and change lines accordingly at *policyweb.t*
(right at the bottom)
```
# use quit for Selenium::Remote::Driver
# use shutdown_binary for Selenium::Chrome
if ($driver) { $driver->quit; }
# if ($driver) { $driver->shutdown_binary; }
```
and at *Frontend.pm*
(right at the top)
```
use base qw(Selenium::Remote::Driver);
# use base qw(Selenium::Chrome);
```