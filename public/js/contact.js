const getData = (event) => {
  event.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const subject = document.getElementById("subject").value;
  const message = document.getElementById("message").value;
  // Condition
  if (name == "") {
    alert("The Name cannot be empty");
  } else if (email == "") {
    alert("The Email cannot be empty");
  } else if (phone == "") {
    alert("The Phone Number cannot be empty");
  } else if (subject == "") {
    alert("The Subject cannot be empty");
  } else if (message == "") {
    alert("The Message cannot be empty");
  } else {
    //   Show to console browser
    console.log(`Name : ${name}`);
    console.log(`Email : ${email}`);
    console.log(`Phone Number : ${phone}`);
    console.log(`Subject : ${subject}`);
    console.log(`Your Message : ${message}`);
    // Send to email
    let a = document.createElement("a");
    a.href = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${email}&body=${message}&su=${subject}`;
    a.target = "_blank";
    a.click();
    //   Reset Form Contact
    document.getElementById("form-contact").reset();
  }
};
