ssid = "SoongiPhone"
password = "lq02wbpztxby"
host = '52.79.148.17'
port = '3000'
path = "/notify?"
ready = false

gpio.mode(8, gpio.OUTPUT)
uart.setup(0, 9600, 8, 0, 1, 0)
uart.on("data", "\n", function(data)
  data = string.gsub(data, "[\r\n]", " ")
  call_server(data)
end, 0)  

wifi.setmode(wifi.STATION)
wifi.sta.config(ssid, password)
wifi.sta.autoconnect(1)

cnt = 1
tmr.alarm(3, 1000, 1, function() 
  if (wifi.sta.getip() == nil) and (cnt < 20) then 
    print("trying wifi AP..."..cnt.." sec")
    cnt = cnt + 1 
  else 
    tmr.stop(3)
    if (cnt < 20) then 
      ip = wifi.sta.getip();
      print("got wifi="..ip..", status="..wifi.sta.status());
      ready = true
    else node.restart()
    end
    cnt = nil;
  end
end)

function call_server(value)

  if ready == false then return end
  
  print("value="..value)

  print(path);
  conn=net.createConnection(net.TCP, 0) 
  conn:on("connection",function(conn, payload)
    conn:send("GET "..path..value.." HTTP/1.1\r\n".. 
      "Accept: */*\r\n"..
      "User-Agent: Mozilla/4.0 (compatible; esp8266 Lua; Kyuho Kim;)\r\n"..
      "\r\n") 
  end)
  
  conn:on("receive", function(conn, payload) 
    print("Received: "..payload)
    abcd = string.find(payload, "stable");
    print(abcd)
    if (abcd ~= nil) then
        print("!!!!");
        gpio.write(8 ,gpio.LOW)
    else 
        gpio.write(8 ,gpio.HIGH)
    end
    conn:close();
  end)
    
  conn:connect(port, host)
end
