"""Keep the latissimus fan on the trunk while the axillary transition follows the arm."""


def latissimus_humeral_share(share, height, shoulder_height):
    # Measured on the neutral atlas mesh. The lower limit protects the broad
    # costal/back sheet. The upper limit retains the existing humeral tendon.
    # This is a skin envelope for the specimen, not a human range of motion.
    start, end = shoulder_height - .186, shoulder_height - .088
    blend = min(1., max(0., (height - start) / (end - start)))
    return share * blend * blend * (3. - 2. * blend)
